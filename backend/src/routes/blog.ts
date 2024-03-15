
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string,
    },
    Variables: {
        userId: string
    }
}>();


blogRouter.use('/*', async (c, next) => {
    const jwt = c.req.header('Authorization');
    if (!jwt) {
        c.status(401);
        return c.json({ error: "unauthorized" });
    }
    const token = jwt.split(' ')[1];
    const payload = await verify(token, "JWT_SECRET");
    if (!payload) {
        c.status(401);
        return c.json({ error: "unauthorized" });
    }
    c.set('userId', payload.id);
    await next()
})

blogRouter.post('/', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

    const blog = await prisma.post.create({
        data: {
            title: body.title,
            content: body.content,
            authorId: c.get("userId")
        }
    })

    c.status(200);
    return c.json({
        id: blog.id
    })
})

blogRouter.put('/', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

    const blog = await prisma.post.update({
        where: {
            id: body.id
        },
        data: {
            title: body.title,
            content: body.content
        }
    })

    c.status(200);
    return c.json({
        msg: "blog updated"
    })
})

blogRouter.get('/bulk', async (c) => {

    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    const blogs = await prisma.post.findMany();

    c.status(200);
    return c.json({ blogs })
})

blogRouter.get('/:id', async (c) => {

    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    const id = c.req.param("id")

    const blog = await prisma.post.findFirst({
        where: {
            id: id
        }
    })

    c.status(200);
    return c.json({
        blog
    })
})




