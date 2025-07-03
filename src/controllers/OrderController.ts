import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();

export const OrderController = {
  list: async ({ set }: { set: any }) => {
    try {
      return prisma.order.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          OrderDetail: {
            select: {
              id: true,
              qty: true,
              price: true,
              Product: {
                select: {
                  name: true,
                  isbn: true,
                  image: true,
                },
              },
            },
          },
          Member: true,
          id: true,
          createdAt: true,
          trackCode: true,
          customerName: true,
          customerPhone: true,
          customerAddress: true,
          slipImage: true,
          status: true,
          express: true,
          remark: true,
          orderNo: true
        },
      });
    } catch (error) {
      set.status = 500;
      return { error: error };
    }
  },

  cancel: async ({
    set,
    params,
    body,
  }: {
    set: any;
    params: {
      id: string;
    };
    body: {
      remark: string;
    };
  }) => {
    try {
      // Check if remark is provided
      if (!body.remark || body.remark.trim() === "") {
        set.status = 400;
        return { error: "กรุณาระบุหมายเหตุสำหรับการยกเลิก" };
      }
      // Get current order
      const order = await prisma.order.findUnique({ where: { id: params.id } });
      if (!order) {
        set.status = 404;
        return { error: "ไม่พบคำสั่งซื้อ" };
      }
      // if (["cancel", "send", "complete"].includes(order.status)) {
      //   set.status = 400;
      //   return { error: "ไม่สามารถยกเลิกคำสั่งซื้อนี้ได้" };
      // }
      const updated = await prisma.order.update({
        where: {
          id: params.id,
        },
        data: {
          remark: body.remark,
          status: "cancel",
        },
      });
      return updated;
    } catch (error) {
      set.status = 500;
      return { error: error };
    }
  },
  paid: async ({
    set,
    params,
  }: {
    set: any;
    params: {
      id: string;
    };
  }) => {
    try {
      const order = await prisma.order.update({
        where: {
          id: params.id,
        },
        data: {
          status: "paid",
          remark: "",
        },
      });
      return order;
    } catch (error) {
      set.status = 500;
      return { error: error };
    }
  },
  send: async ({
    set,
    body,
  }: {
    set: {
      status: number;
    };
    body: {
      trackCode: string;
      express: string;
      remark: string;
      orderId: string;
    };
  }) => {
    try {
      // Only allow send if current status is 'paid'
      const order = await prisma.order.findUnique({ where: { id: body.orderId } });
      if (!order) {
        set.status = 404;
        return { error: 'ไม่พบคำสั่งซื้อ' };
      }
      if (order.status !== 'paid') {
        set.status = 400;
        return { error: 'สถานะคำสั่งซื้อต้องเป็น "paid" ก่อนจัดส่ง' };
      }
      await prisma.order.update({
        where: {
          id: body.orderId,
        },
        data: {
          trackCode: body.trackCode,
          express: body.express,
          remark: body.remark,
          status: "send",
        },
      });
    } catch (error) {
      set.status = 500;
      return { error: error };
    }
  },

  /**
   * Auto-complete orders: set status to 'complete' if 15 days have passed since createdAt and status is 'send'.
   * To be called by scheduled job or admin trigger.
   */
  autoCompleteOrders: async () => {
    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    try {
      const toComplete = await prisma.order.findMany({
        where: {
          status: 'send',
          createdAt: { lte: fifteenDaysAgo },
        },
      });
      for (const order of toComplete) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'complete' },
        });
      }
      return { updated: toComplete.length };
    } catch (error) {
      return { error };
    }
  },
};
