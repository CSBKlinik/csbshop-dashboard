"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/components/ui/table";
import { Input } from "@/components/components/ui/input";
import { Button } from "@/components/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/components/ui/cards/card";
import { ArrowUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@headlessui/react"; // Utilisation du switch pour le toggle

type Product = {
  id: number;
  title: string;
  stock: string;
  pricing: number;
  original_price?: number;
  active: boolean; // Ajout de la disponibilité
};

type Order = {
  id: number;
  date: string;
  order_summary: {
    purchase: Array<{
      quantity: number;
      product: {
        id: number;
        title: string;
      };
    }>;
  };
  total_amount: string;
};

type Promotion = {
  id: number;
  attributes: {
    debut: string;
    fin: string;
    amount: number;
    percentage: number | null;
    active: boolean;
    products: {
      data: Array<{ id: number }>;
    };
  };
};

type ProductManagementProps = {
  products: Product[];
  orders: Order[];
  promotions: Promotion[];
  credentials: any;
};

export default function ProductManagement({
  products,
  orders,
  promotions,
  credentials,
}: ProductManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<
    "title" | "stock" | "sales" | "revenue"
  >("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [availability, setAvailability] = useState<{ [key: number]: boolean }>(
    () =>
      products.reduce(
        (acc, product) => ({ ...acc, [product.id]: product.active }),
        {}
      )
  );

  const getPromotionPrice = (
    date: string,
    productId: number,
    originalPrice: number,
    productOriginalPrice: number | null
  ) => {
    const orderDate = new Date(date);
    const activePromo = promotions.find(
      (promo) =>
        promo.attributes.active &&
        new Date(promo.attributes.debut) <= orderDate &&
        new Date(promo.attributes.fin) >= orderDate &&
        promo.attributes.products.data.some((p) => p.id === productId)
    );

    if (activePromo) {
      const isPromotionEnded =
        new Date(activePromo.attributes.fin) < new Date();

      const priceToApply = isPromotionEnded
        ? productOriginalPrice || originalPrice
        : originalPrice;

      if (activePromo.attributes.amount > 0) {
        return Math.max(0.01, priceToApply - activePromo.attributes.amount);
      } else if (activePromo.attributes.percentage !== null) {
        return Math.max(
          0.01,
          priceToApply * (1 - activePromo.attributes.percentage / 100)
        );
      }
    }

    return originalPrice;
  };

  const salesData = useMemo(() => {
    const data: { [key: number]: { quantity: number; revenue: number } } = {};
    orders.forEach((order) => {
      order.order_summary.purchase.forEach((item) => {
        if (!data[item.product.id]) {
          data[item.product.id] = { quantity: 0, revenue: 0 };
        }
        const product = products.find((p) => p.id === item.product.id);
        if (product) {
          const promotionalPrice = getPromotionPrice(
            order.date,
            item.product.id,
            product.pricing,
            product.original_price! // Add this if it's active in the product data
          );
          data[item.product.id].quantity += item.quantity;
          data[item.product.id].revenue += item.quantity * promotionalPrice!;
        }
      });
    });
    return data;
  }, [orders, products, promotions]);

  const sortedProducts = useMemo(() => {
    return [...products]
      .filter((product) =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const aValue =
          sortColumn === "title"
            ? a.title
            : sortColumn === "stock"
            ? parseInt(a.stock)
            : sortColumn === "sales"
            ? salesData[a.id]?.quantity || 0
            : salesData[a.id]?.revenue || 0;
        const bValue =
          sortColumn === "title"
            ? b.title
            : sortColumn === "stock"
            ? parseInt(b.stock)
            : sortColumn === "sales"
            ? salesData[b.id]?.quantity || 0
            : salesData[b.id]?.revenue || 0;

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [products, searchTerm, sortColumn, sortDirection, salesData]);

  const handleSort = (column: "title" | "stock" | "sales" | "revenue") => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const updateStock = (productId: number, newStock: string) => {
    console.log(`Updating stock for product ${productId} to ${newStock}`);
  };

  const toggleAvailability = async (productId: number) => {
    const newAvailability = !availability[productId];
    setAvailability({ ...availability, [productId]: newAvailability });
    let datas = {
      data: {
        active: newAvailability,
      },
    };
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${credentials?.user?.jwt}`,
          },
          body: JSON.stringify(datas),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de la disponibilité");
      }

      console.log(
        `Product ${productId} availability updated to ${newAvailability}`
      );
    } catch (error) {
      console.error(error);
    }
  };

  const totalSales = useMemo(() => {
    return Object.values(salesData).reduce(
      (acc, curr) => acc + curr.quantity,
      0
    );
  }, [salesData]);

  const totalRevenue = useMemo(() => {
    return Object.values(salesData).reduce(
      (acc, curr) => acc + curr.revenue,
      0
    );
  }, [salesData]);

  const getStockColor = (stock: number) => {
    if (stock < 10) return "text-red-500";
    if (stock < 15) return "text-orange-500";
    return "text-green-500";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-gray-500" />
          <Input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total des Ventes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Chiffre d&lsquo;Affaires Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue.toFixed(2)} €
            </div>
          </CardContent>
        </Card>
      </div>

      <Table className="bg-white rounded-lg">
        <TableHeader>
          <TableRow>
            <TableHead
              className="w-[200px] cursor-pointer"
              onClick={() => handleSort("title")}
            >
              Produit{" "}
              {sortColumn === "title" && (
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              )}
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("stock")}
            >
              Stock{" "}
              {sortColumn === "stock" && (
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              )}
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("sales")}
            >
              Ventes{" "}
              {sortColumn === "sales" && (
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              )}
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("revenue")}
            >
              Chiffre d&lsquo;Affaires{" "}
              {sortColumn === "revenue" && (
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              )}
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProducts.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.title}</TableCell>
              <TableCell
                className={cn(
                  getStockColor(parseInt(product.stock)),
                  "font-bold"
                )}
              >
                {product.stock}
              </TableCell>
              <TableCell>{salesData[product.id]?.quantity || 0}</TableCell>
              <TableCell>
                {(salesData[product.id]?.revenue || 0).toFixed(2)} €
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    defaultValue={product.stock}
                    className="w-20"
                    onChange={(e: any) =>
                      updateStock(product.id, e.target.value)
                    }
                  />
                  <Button size="sm">Mettre à jour</Button>
                  <Switch
                    checked={availability[product.id]}
                    onChange={() => toggleAvailability(product.id)}
                    className={`${
                      availability[product.id] ? "bg-green-600" : "bg-gray-200"
                    } relative inline-flex h-6 w-11 items-center rounded-full`}
                  >
                    <span
                      className={`${
                        availability[product.id]
                          ? "translate-x-6"
                          : "translate-x-1"
                      } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                    />
                  </Switch>
                  <p
                    className={`capitalize font-semibold text-[12px] italic ${
                      availability[product.id]
                        ? "text-green-600"
                        : "text-gray-700"
                    }`}
                  >
                    {availability[product.id] ? "disponible" : "indisponible"}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
