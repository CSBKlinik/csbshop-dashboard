"use client";

import React, { useState, useEffect } from "react";
import {
  ScanSearch,
  SquareChevronLeft,
  SquareChevronRight,
  Settings,
  ArrowUpDown,
  Truck,
} from "lucide-react";
import { Button } from "@/components/components/ui/button";
import { Input } from "@/components/components/ui/input";
import { Label } from "@/components/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/components/ui/select";
import * as Yup from "yup";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import updateOrder from "@/app/(dashboard)/admin/laboratory/managing-orders/actions";

type Order = {
  id: number;
  date: string;
  deliver_follow: string;
  total_amount: string;
  tracking_number?: string;
  carrier?: string;
  shipping_adress: any;
  users_permissions_user: {
    id: number;
    username: string;
    email: string;
  };
};

type OrderStatus =
  | "in progress"
  | "on hold"
  | "shipped"
  | "completed"
  | "canceled"
  | "beached"
  | "refunded";

const OrderSchema = Yup.object().shape({
  tracking_number: Yup.string().required("Le numéro de suivi est requis"),
  carrier: Yup.string().required("Le transporteur est requis"),
  status: Yup.string().required("Le statut est requis"),
});

export default function EnhancedOrdersTable({
  orders: initialOrders,
  jwt,
  transporters,
}: {
  orders: Order[];
  jwt: string;
  transporters: any;
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [sortBy, setSortBy] = useState<"total_amount" | "date">("total_amount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const ordersPerPage = 6;

  const sortedOrders = orders
    .filter((order: Order) =>
      order.users_permissions_user.email
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
    .filter((order: Order) =>
      statusFilter === "all" ? true : order.deliver_follow === statusFilter
    )
    .sort((a: Order, b: Order) => {
      if (sortBy === "total_amount") {
        const amountA = parseFloat(a.total_amount);
        const amountB = parseFloat(b.total_amount);
        return sortOrder === "asc" ? amountA - amountB : amountB - amountA;
      } else if (sortBy === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });

  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  const totalPages = Math.ceil(sortedOrders.length / ordersPerPage);

  const handleSort = (criteria: "total_amount" | "date") => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(criteria);
      setSortOrder("desc");
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleManageOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  console.log("selectedOrder:", selectedOrder);
  const formik = useFormik({
    initialValues: {
      tracking_number: selectedOrder?.tracking_number || "",
      carrier: selectedOrder?.carrier || "",
      status: selectedOrder?.deliver_follow || "in progress",
      transporter: {
        name: "",
        tracking_link: "",
      },
    },
    validationSchema: OrderSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      if (selectedOrder) {
        const updatedOrder = {
          data: {
            tracking_number: values.tracking_number,
            carrier: values.carrier,
            deliver_follow: values.status,
            transporter: {
              name: values.transporter.name,
              tracking_link: values.transporter.tracking_link,
            },
          },
        };
        const update = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${selectedOrder?.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${jwt}`,
            },
            body: JSON.stringify(updatedOrder),
          }
        );

        if (update.ok) {
          toast.success("Les informations ont été mises à jour avec succès !");
          resetForm();

          // Optimistically update the order list state
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.id === selectedOrder.id
                ? { ...order, ...updatedOrder.data }
                : order
            )
          );

          // Optionally trigger a re-fetch or revalidation of the orders
          updateOrder(); // If this triggers revalidation on the server
          setIsDialogOpen(false);
        } else {
          toast.error("Une erreur est survenue lors de la mise à jour.");
        }
      }
    },
  });

  return (
    <div>
      {/* UI and Table */}
      <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Rechercher par email client"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <ScanSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as OrderStatus | "all")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="in progress">En cours</SelectItem>
            <SelectItem value="on hold">En attente</SelectItem>
            <SelectItem value="shipped">Expédiée</SelectItem>
            <SelectItem value="completed">Complétée</SelectItem>
            <SelectItem value="canceled">Annulée</SelectItem>
            <SelectItem value="beached">Échouée</SelectItem>
            <SelectItem value="refunded">Remboursée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-300">
        <table className="min-w-full bg-white text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="px-4 py-2 border-b text-left">Client</th>
              <th className="px-4 py-2 border-b text-left">Status</th>
              <th
                className="px-4 py-2 border-b cursor-pointer text-left"
                onClick={() => handleSort("total_amount")}
              >
                Montant
                <ArrowUpDown className="inline ml-1 h-4 w-4" />
              </th>
              <th
                className="px-4 py-2 border-b cursor-pointer text-left"
                onClick={() => handleSort("date")}
              >
                Date
                <ArrowUpDown className="inline ml-1 h-4 w-4" />
              </th>
              <th className="px-4 py-2 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order: Order) => {
                return (
                  <tr key={order.id}>
                    <td className="px-4 py-2 border-b text-left">
                      {/* @ts-ignore */}
                      {order.users_permissions_user.firstName}{" "}
                      {/* @ts-ignore */}
                      {order.users_permissions_user.lastName}
                    </td>
                    <td className="px-4 py-2 border-b text-left">
                      <span
                        className={`px-2 py-1 inline-block rounded-lg text-xs font-medium ${
                          getStatusLabel(order.deliver_follow).color
                        }`}
                      >
                        {getStatusLabel(order.deliver_follow).label}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b text-left font-semibold">
                      €{(parseFloat(order.total_amount) / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 border-b text-left">
                      {new Date(order.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 border-b text-left">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageOrder(order)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Gérer
                      </Button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-2 text-center">
                  Aucune commande disponible.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-4 items-center mt-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <SquareChevronLeft className="w-4 h-4" />
        </Button>

        <span className="text-sm">
          Page {currentPage} sur {totalPages}
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <SquareChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Gérer la commande</DialogTitle>
          </DialogHeader>
          <div className="w-full p-2 flex gap-2">
            <div className="bg-regularBlue bg-opacity-20 p-2 h-fit rounded-lg">
              <Truck className="w-6 h-6 text-regularBlue" />
            </div>
            <div>
              <p className="text-[14px] font-medium">Addresse de livraison:</p>
              <div className="text-[13px] font-medium text-gray-600">
                {/* @ts-ignore */}
                <p>
                  {/* @ts-ignore */}
                  {selectedOrder?.users_permissions_user?.firstName}{" "}
                  {/* @ts-ignore */}
                  {selectedOrder?.users_permissions_user?.lastName}
                </p>
                <p>{selectedOrder?.shipping_adress.adresse}</p>
                <p className="uppercase">
                  {selectedOrder?.shipping_adress.zip}{" "}
                  {selectedOrder?.shipping_adress.city}
                </p>
                <p className="uppercase">
                  {selectedOrder?.shipping_adress.country}
                </p>
              </div>
            </div>
          </div>
          {selectedOrder && (
            <form onSubmit={formik.handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tracking_number" className="text-right">
                    N° de suivi
                  </Label>
                  <Input
                    id="tracking_number"
                    name="tracking_number"
                    value={formik.values.tracking_number}
                    onChange={formik.handleChange}
                    className="col-span-3"
                  />
                  {formik.errors.tracking_number &&
                  formik.touched.tracking_number ? (
                    <div className="text-red-500 text-sm">
                      {formik.errors.tracking_number}
                    </div>
                  ) : null}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="transporter" className="text-right">
                    Transporteurs
                  </Label>
                  <Select
                    name="transporter"
                    value={formik.values.transporter.name}
                    onValueChange={(value: string) => {
                      const selectedTransporter = transporters.data.find(
                        (transporter: any) =>
                          transporter.attributes.name === value
                      );
                      if (selectedTransporter) {
                        formik.setFieldValue("transporter", {
                          name: selectedTransporter.attributes.name,
                          tracking_link:
                            selectedTransporter.attributes.base_link +
                            formik.values.tracking_number,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner un transporteur" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {transporters.data.map((transporter: any) => (
                        <SelectItem
                          key={transporter.id}
                          value={transporter.attributes.name}
                        >
                          {transporter.attributes.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Statut
                  </Label>
                  <Select
                    name="status"
                    value={formik.values.status}
                    onValueChange={(value) =>
                      formik.setFieldValue("status", value)
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="in progress">En cours</SelectItem>
                      <SelectItem value="on hold">En attente</SelectItem>
                      <SelectItem value="shipped">Expédiée</SelectItem>
                      <SelectItem value="completed">Complétée</SelectItem>
                      <SelectItem value="canceled">Annulée</SelectItem>
                      <SelectItem value="beached">Échouée</SelectItem>
                      <SelectItem value="refunded">Remboursée</SelectItem>
                    </SelectContent>
                  </Select>
                  {formik.errors.status && formik.touched.status ? (
                    <div className="text-red-500 text-sm">
                      {formik.errors.status}
                    </div>
                  ) : null}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Mettre à jour</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "in progress":
      return { label: "En cours", color: "bg-yellow-200 text-black" };
    case "on hold":
      return { label: "En attente", color: "bg-gray-200 text-gray-800" };
    case "shipped":
      return { label: "Expédiée", color: "bg-blue-500 text-white" };
    case "completed":
      return { label: "Complétée", color: "bg-green-500 text-white" };
    case "canceled":
      return { label: "Annulée", color: "bg-red-500 text-white" };
    case "beached":
      return { label: "Échouée", color: "bg-red-800 text-white" };
    case "refunded":
      return { label: "Remboursée", color: "bg-purple-500 text-white" };
    default:
      return { label: "Inconnu", color: "bg-gray-300 text-black" };
  }
};
