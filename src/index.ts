import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import jwt from '@elysiajs/jwt';
import { swagger } from "@elysiajs/swagger";
import { staticPlugin } from "@elysiajs/static";
import { AdminController } from "./controllers/AdminController";
import { ProductController } from "./controllers/ProductController";

const app = new Elysia()
.use(cors())
.use(swagger())
.use(
  staticPlugin({
    assets: './uploads',
    prefix: '/uploads'
  })
)

.use(
  jwt({
    name: 'jwt',
    secret: 'wickwub'
  })
)


.group('/api/admin', app => app
  .post('/create', AdminController.create)
  .post('/signin', AdminController.signin)
  .get('/info', AdminController.info)
  .put('/update', AdminController.update)
  .get('/list', AdminController.list)
  .put('/update-data/:id', AdminController.updateData)
  .delete('/remove/:id', AdminController.remove)
)

.group('/api/product', app => app
  .get('/list', ProductController.list)
  .post('/create', ProductController.create)
  .put('/update/:id', ProductController.update)
  .delete('/remove/:id', ProductController.remove)
)




.get("/", () => "Hello Elysia")


.listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
