
import { signupInput } from "@100xdevs/medium-common";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";



export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string
    }
}>();


userRouter.post('/signup', async (c) => {


    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const signupbody = signupInput.safeParse(body);

    if (!signupbody) {
        c.status(411);
        return c.json({
            msg: "Wrong inputs"
        })
    }

    const exist = await prisma.user.findFirst({
        where: {
            email: body.email
        }
    })

    if (!exist) {
        try {
            const user = await prisma.user.create({
                data: {
                    email: body.email,
                    password: body.password
                }
            });

            const jwt = await sign({ id: user.id }, "JWT_SECRET");

            return c.json({
                msg: "Successfully created account",
                jwt: jwt
            })
        } catch (e) {
            return (c.status(403) as any).json({
                msg: "Wrong Inputs, Prashant"
            });
        }
    }
    else {
        return c.json({
            msg: "Email already in use"
        })
    }


})


userRouter.post('/signin', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const user = await prisma.user.findUnique({
        where: {
            email: body.email
        }
    });

    if (!user) {
        c.status(403);
        return c.json({ error: "user not found" });
    }

    const jwt = await sign({ id: user.id }, "JWT_SECRET");
    return c.json({ jwt });
})
