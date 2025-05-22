"use client";

import React, { useState } from "react";
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
import Image from "next/image";

// Types

type Order = {
  id: number;
  date: string;
  deliver_follow: string;
  total_amount: string;
  tracking_number?: string;
  carrier?: string;
  shipping_adress: {
    adresse: string;
    zip: string;
    city: string;
    country: string;
  };
  users_permissions_user: {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  order_summary: any;
  transporter?: { name: string; tracking_link: string };
};

type OrderStatus =
  | "in progress"
  | "on hold"
  | "shipped"
  | "completed"
  | "canceled"
  | "beached"
  | "refunded";

// Validation schema

const OrderSchema = Yup.object().shape({
  tracking_number: Yup.string().required("Le numéro de suivi est requis"),
  carrier: Yup.string().required("Le transporteur est requis"),
  status: Yup.string().required("Le statut est requis"),
});

// Component

export default function EnhancedOrdersTable({
  orders: initialOrders,
  jwt,
  transporters,
}: {
  orders: Order[];
  jwt: string;
  transporters: any;
}) {
  // Table state
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [sortBy, setSortBy] = useState<"total_amount" | "date">("total_amount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const ordersPerPage = 6;
  console.log("orders:", orders);
  // Sorting & filtering
  const sortedOrders = orders
    .filter((order) =>
      order.users_permissions_user.email
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
    .filter((order) =>
      statusFilter === "all" ? true : order.deliver_follow === statusFilter
    )
    .sort((a: any, b: any) => {
      if (sortBy === "total_amount") {
        // Calculer le montant réel de la commande "a"
        const aAmt = a.order_summary.purchase.reduce(
          (sum: any, item: any) => sum + item.quantity * item.product.pricing,
          0
        );
        // Calculer le montant réel de la commande "b"
        const bAmt = b.order_summary.purchase.reduce(
          (sum: any, item: any) => sum + item.quantity * item.product.pricing,
          0
        );
        return sortOrder === "asc" ? aAmt - bAmt : bAmt - aAmt;
      }

      // Sinon on trie par date
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    });

  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  const totalPages = Math.ceil(sortedOrders.length / ordersPerPage);

  // Handlers
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

  // Formik
  const formik = useFormik({
    initialValues: {
      tracking_number: selectedOrder?.tracking_number || "",
      carrier: selectedOrder?.carrier || "",
      status: selectedOrder?.deliver_follow || "in progress",
      transporter: selectedOrder?.transporter || {
        name: "",
        tracking_link: "",
      },
    },
    validationSchema: OrderSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      if (!selectedOrder) return;
      const payload = {
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${selectedOrder.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        toast.success("Les informations ont été mises à jour !");
        resetForm();
        setIsDialogOpen(false);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrder.id ? { ...o, ...payload.data } : o
          )
        );
        updateOrder();
      } else {
        toast.error("Erreur lors de la mise à jour.");
      }
    },
  });

  console.log("selectedOrder:", selectedOrder);

  return (
    <div>
      {/* Recherche & filtre */}
      <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Rechercher par email client"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <ScanSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
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

      {/* Tableau */}
      <div className="overflow-hidden rounded-lg border border-gray-300">
        <table className="min-w-full bg-white text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="px-4 py-2 border-b text-left">Client</th>
              <th className="px-4 py-2 border-b text-left">Statut</th>
              <th
                className="px-4 py-2 border-b cursor-pointer text-left"
                onClick={() => handleSort("total_amount")}
              >
                Montant <ArrowUpDown className="inline ml-1 h-4 w-4" />
              </th>
              <th
                className="px-4 py-2 border-b cursor-pointer text-left"
                onClick={() => handleSort("date")}
              >
                Date <ArrowUpDown className="inline ml-1 h-4 w-4" />
              </th>
              <th className="px-4 py-2 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order: any) => {
                // Calcul inline du montant réel de la commande
                const amount = order.order_summary.purchase.reduce(
                  (sum: any, item: any) =>
                    sum + item.quantity * item.product.pricing,
                  0
                );

                const status = getStatusLabel(order.deliver_follow);
                const name = `${order.users_permissions_user.firstName} ${order.users_permissions_user.lastName}`;

                return (
                  <tr key={order.id}>
                    <td className="px-4 py-2 border-b">{name}</td>
                    <td className="px-4 py-2 border-b">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b font-semibold">
                      €{amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {new Date(order.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-2 border-b">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageOrder(order)}
                      >
                        <Settings className="w-4 h-4 mr-2" /> Gérer
                      </Button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-2 text-center">
                  Aucune commande.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end items-center gap-4 mt-4">
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

      {/* Dialog gestion commande */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Gérer la commande</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <form onSubmit={formik.handleSubmit}>
              {/* hidden carrier pour Formik */}
              <input
                type="hidden"
                name="carrier"
                value={formik.values.carrier}
              />
              <div className="flex items-start gap-2 p-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Adresse de livraison :</p>
                  <div className="text-gray-600 text-xs">
                    <p>
                      {selectedOrder.users_permissions_user.firstName}{" "}
                      {selectedOrder.users_permissions_user.lastName}
                    </p>
                    <p>{selectedOrder.shipping_adress.adresse}</p>
                    <p className="uppercase">
                      {selectedOrder.shipping_adress.zip}{" "}
                      {selectedOrder.shipping_adress.city}
                    </p>
                    <p className="uppercase">
                      {selectedOrder.shipping_adress.country}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 mt-4">
                {selectedOrder?.order_summary?.purchase?.map(
                  (el: any, index: number) => {
                    return (
                      <div className="w-1/2" key={index}>
                        <div className="relative w-full h-[40px] rounded-full overflow-hidden">
                          <Image
                            src={el?.product?.image[0]?.url}
                            alt="produit"
                            fill
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <p className="text-xs">
                          {el?.product?.title} <br />
                          <strong>X</strong>
                          {el?.quantity}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
              <div className="grid gap-4 py-4">
                {/* Tracking */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tracking_number" className="text-right">
                    N° de suivi
                  </Label>
                  <Input
                    id="tracking_number"
                    name="tracking_number"
                    value={formik.values.tracking_number}
                    onChange={(e) => {
                      formik.handleChange(e);
                      const name = formik.values.transporter.name;
                      if (name) {
                        const sel = transporters.data.find(
                          (t: any) => t.attributes.name === name
                        );
                        if (sel) {
                          formik.setFieldValue("transporter", {
                            name,
                            tracking_link:
                              sel.attributes.base_link + e.target.value,
                          });
                        }
                      }
                    }}
                    className="col-span-3"
                  />
                  {formik.touched.tracking_number &&
                    formik.errors.tracking_number && (
                      <div className="text-red-500 text-sm">
                        {formik.errors.tracking_number}
                      </div>
                    )}
                </div>
                {/* Transporteur */}
                <div className="grid grid-cols-4 items-center gap-4 bg-white">
                  <Label htmlFor="transporter" className="text-right">
                    Transporteur
                  </Label>
                  <Select
                    value={formik.values.transporter.name}
                    onValueChange={(value: string) => {
                      const sel = transporters.data.find(
                        (t: any) => t.attributes.name === value
                      );
                      if (sel) {
                        const link =
                          sel.attributes.base_link +
                          formik.values.tracking_number;
                        formik.setFieldValue("carrier", sel.attributes.name);
                        formik.setFieldValue("transporter", {
                          name: sel.attributes.name,
                          tracking_link: link,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner un transporteur" />
                    </SelectTrigger>
                    <SelectContent>
                      {transporters.data.map((t: any) => (
                        <SelectItem key={t.id} value={t.attributes.name}>
                          {t.attributes.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formik.touched.carrier && formik.errors.carrier && (
                    <div className="text-red-500 text-sm">
                      {formik.errors.carrier}
                    </div>
                  )}
                </div>
                {/* Statut */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Statut
                  </Label>
                  <Select
                    name="status"
                    value={formik.values.status}
                    onValueChange={(v) => formik.setFieldValue("status", v)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in progress">En cours</SelectItem>
                      <SelectItem value="on hold">En attente</SelectItem>
                      <SelectItem value="shipped">Expédiée</SelectItem>
                      <SelectItem value="completed">Complétée</SelectItem>
                      <SelectItem value="canceled">Annulée</SelectItem>
                      <SelectItem value="beached">Échouée</SelectItem>
                      <SelectItem value="refunded">Remboursée</SelectItem>
                    </SelectContent>
                  </Select>
                  {formik.touched.status && formik.errors.status && (
                    <div className="text-red-500 text-sm">
                      {formik.errors.status}
                    </div>
                  )}
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

// Helper pour les labels

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
