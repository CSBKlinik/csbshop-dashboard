"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/components/ui/cards/card";
import EnhancedOrdersTable from "@/components/sales/EnhancedOrdersTables";
import {
  BadgeEuro,
  Handshake,
  ShoppingCartIcon,
  TicketCheck,
} from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useEffect, useMemo, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Order = {
  id: number;
  date: string;
  deliver_follow: string;
  total_amount: string;
  order_summary: {
    purchase: Array<{
      quantity: number;
      product: {
        title: string;
        pricing: number;
        stock: string;
      };
    }>;
  };
  users_permissions_user: {
    id: number;
    username: string;
    email: string;
  };
};

type SalesMetrics = {
  turnover: number;
  numberOfSales: number;
  averageBasket: number;
  numberOfCustomers: number;
  salesPerCustomer: number;
  salesPerProduct: Array<{ title: string; quantity: number; turnover: number }>;
  packSales: number;
  mostSoldProduct: { title: string; quantity: number };
  leastSoldProduct: { title: string; quantity: number };
  averagePurchasesPerCustomer: number;
  bestCustomer: { username: string; totalPurchases: number };
};

// Function to filter orders by date range
const filterOrdersByDateRange = (orders: any, dateRange: string) => {
  const now = new Date();
  return orders.filter((order: any) => {
    const orderDate = new Date(order.date);
    switch (dateRange) {
      case "today":
        return orderDate.toDateString() === now.toDateString();
      case "thisWeek":
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        return orderDate >= weekStart;
      case "pastTwoWeeks":
        const twoWeeksAgo = new Date(now.setDate(now.getDate() - 14));
        return orderDate >= twoWeeksAgo;
      case "thisMonth":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return orderDate >= monthStart;
      case "fromBeginning":
      default:
        return true; // No filter, show all
    }
  });
};

const ManagingOrdersPage = ({ orders }: { orders: Order[] }) => {
  const [dateRange, setDateRange] = useState("fromBeginning");
  const { data: session } = useSession();
  const [ordersState, setOrdersState] = useState<Order[]>(orders); // Maintain a local state for orders

  useEffect(() => {
    // Update local state when orders change
    setOrdersState(orders);
  }, [orders]);

  // Filter orders based on the selected date range
  const filteredOrders = useMemo(
    () => filterOrdersByDateRange(ordersState, dateRange),
    [ordersState, dateRange]
  );

  const salesMetrics: SalesMetrics = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return {
        turnover: 0,
        numberOfSales: 0,
        averageBasket: 0,
        numberOfCustomers: 0,
        salesPerCustomer: 0,
        salesPerProduct: [],
        packSales: 0,
        mostSoldProduct: { title: "N/A", quantity: 0 },
        leastSoldProduct: { title: "N/A", quantity: 0 },
        averagePurchasesPerCustomer: 0,
        bestCustomer: { username: "N/A", totalPurchases: 0 },
      };
    }

    const turnover =
      filteredOrders.reduce(
        (sum: any, order: any) => sum + parseFloat(order.total_amount),
        0
      ) / 100;
    const numberOfSales = filteredOrders.length;
    const averageBasket = turnover / numberOfSales;
    const allClients = filteredOrders.map(
      (order: any) => order.users_permissions_user
    );
    const uniqueClients = allClients.filter(
      (client: any, index: any, self: any) =>
        index === self.findIndex((c: any) => c.id === client.id)
    );
    const numberOfCustomers = uniqueClients.length;
    const salesPerCustomer = numberOfSales / numberOfCustomers;

    const productSales: {
      [key: string]: {
        quantity: number;
        turnover: number;
        price: number;
        stock: string | null;
      };
    } = {};
    let packSales = 0;
    let customerPurchases: { [key: string]: number } = {};

    filteredOrders.forEach((order: any) => {
      order.order_summary.purchase.forEach((item: any) => {
        const { title, pricing, stock } = item.product;
        if (!productSales[title]) {
          productSales[title] = {
            quantity: 0,
            turnover: 0,
            price: pricing,
            stock,
          };
        }
        productSales[title].quantity += item.quantity;
        productSales[title].turnover += item.quantity * pricing;

        if (item.quantity > 1) packSales++;
      });

      const customerId = order.users_permissions_user.id;
      customerPurchases[customerId] = (customerPurchases[customerId] || 0) + 1;
    });

    const salesPerProduct = Object.entries(productSales).map(
      ([title, data]) => ({
        title,
        ...data,
      })
    );

    const mostSoldProduct = salesPerProduct.reduce(
      (max, product) => (product.quantity > max.quantity ? product : max),
      { title: "N/A", quantity: 0 }
    );

    const leastSoldProduct = salesPerProduct.reduce(
      (min, product) => (product.quantity < min.quantity ? product : min),
      { title: "N/A", quantity: Infinity }
    );

    const averagePurchasesPerCustomer =
      Object.values(customerPurchases).reduce(
        (sum, purchases) => sum + purchases,
        0
      ) / numberOfCustomers;

    const bestCustomer = Object.entries(customerPurchases).reduce(
      (best, [customerId, purchases]) => {
        if (purchases > best.totalPurchases) {
          const customer = uniqueClients.find(
            (c: any) => c.id.toString() === customerId
          );
          return {
            username: customer ? customer.username : "N/A",
            totalPurchases: purchases,
          };
        }
        return best;
      },
      { username: "N/A", totalPurchases: 0 }
    );

    return {
      turnover,
      numberOfSales,
      averageBasket,
      numberOfCustomers,
      salesPerCustomer,
      salesPerProduct,
      packSales,
      mostSoldProduct,
      leastSoldProduct,
      averagePurchasesPerCustomer,
      bestCustomer,
    };
  }, [filteredOrders]);

  return (
    <main className="font-outfit p-6 space-y-6 w-full max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion des commandes</h1>
        {/* Select Input for Filtering */}
        <select
          className="border border-gray-300 rounded-lg p-2"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="today">Aujourd&lsquo;hui</option>
          <option value="thisWeek">Cette semaine</option>
          <option value="pastTwoWeeks">Les deux dernières semaines</option>
          <option value="thisMonth">Ce mois-ci</option>
          <option value="fromBeginning">Depuis le début</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-start gap-4 space-y-0 pb-2 text-[#1E90FF]">
            <div className="bg-[#1E90FF] bg-opacity-20 p-2 rounded-lg">
              <BadgeEuro className="h-4 w-4 text-muted-foreground " />
            </div>
            <CardTitle className="text-sm font-semibold">CA TOTAL</CardTitle>
          </CardHeader>
          <CardContent className="text-black">
            <div className="text-2xl font-bold">
              €{salesMetrics.turnover.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-start gap-4 space-y-0 pb-2 text-[#FFA500]">
            <div className="bg-[#FFA500] bg-opacity-20 p-2 rounded-lg">
              <Handshake className="h-4 w-4 text-muted-foreground " />
            </div>
            <CardTitle className="text-sm font-semibold  uppercase">
              Nombre commandes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-black">
            <div className="text-2xl font-bold">
              {salesMetrics.numberOfSales}
            </div>
            <p className="text-xs text-muted-foreground">
              +180.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-start gap-4 space-y-0 pb-2 text-[#8A2BE2]">
            <div className="bg-[#8A2BE2] bg-opacity-20 p-2 rounded-lg">
              <ShoppingCartIcon className="h-4 w-4 text-muted-foreground " />
            </div>
            <CardTitle className="text-sm font-semibold uppercase">
              Panier Moyen
            </CardTitle>
          </CardHeader>
          <CardContent className="text-black">
            <div className="text-2xl font-bold">
              €{salesMetrics.averageBasket.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              +19% from last month
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-start gap-4 space-y-0 pb-2 text-regularBlue">
            <div className="bg-regularBlue bg-opacity-20 p-2 rounded-lg">
              <TicketCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-sm font-semibold uppercase">
              Commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedOrdersTable
              orders={filteredOrders}
              // @ts-ignore
              jwt={session?.user?.jwt}
            />
          </CardContent>
        </Card>
      </div>
      <ToastContainer />
    </main>
  );
};

export default ManagingOrdersPage;
