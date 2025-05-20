import { PrismaClient } from "../../generated/prisma";
import { ProductInterface } from "../../interface/ProductInterface";
const prisma = new PrismaClient()

export const ProductController = {
    create: async ({ body }: { body: ProductInterface}) => {
        try {
            const timestamp = Date.now()
            const imageName = `${timestamp}_${body.image.name}`
            const image = body.image
            const product = await prisma.product.create({
                data: {
                    name: body.name,
                    price: parseInt(body.price.toString()),
                    isbn: body.isbn,
                    description: body.description,
                    category: body.category,
                    image: imageName
                }
            })

            Bun.write('uploads/' + imageName, image)
            return product
        } catch (error) {
            return { error: error}
        }
    },
    list: async () => {
        try {
            return await prisma.product.findMany({
                orderBy: {
                    createdAt: 'desc'
                }
            })
        } catch (error) {
            return { error: error}
        }
    },
    update: async ({ params, body}: {
        params: {
            id: string
        },
        body: ProductInterface
    }) => {
        try {
            const timestamp = Date.now()
            const imageName = `${timestamp}_${body.image.name}`
            const image = body.image ?? null

            if (imageName !== '') {
                const oldProduct = await prisma.product.findUnique({
                    where: {
                        id: params.id
                    }
                })

                const file = Bun.file('uploads/' + oldProduct?.image)

                if (await file.exists()) {
                    await file.delete()
                }

                Bun.write('uploads/' + imageName, image)
            }

            const product = await prisma.product.update({
                where: {
                    id: params.id
                },
                data: {
                    name: body.name,
                    price: parseInt(body.price.toString()),
                    isbn: body.isbn,
                    description: body.description,
                    category: body.category,
                    image: imageName
                }
            })
            return product
        } catch (error) {
            return { error: error }
        }
    },
    remove: async ({ params }: {
        params: {
            id: string
        }
    }) => {
        try {
            const oldProduct = await prisma.product.findUnique({
                where: {
                    id: params.id
                }
            })

            if (oldProduct?.image != null) {
                const filePath = 'uploads/' + oldProduct?.image
                const file = Bun.file(filePath)

                if (await file.exists()) {
                    await file.delete()
                }
            }
            await prisma.product.delete({
                where: {
                    id: params.id
                }
            })
            return { message: 'Product deleted successfully' }
        } catch (error) {
            return { error: error}
        }
    },
}