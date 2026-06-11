"use client";

import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
type Props = {
  data: any;
};

function formatMoney(amountInCents: any) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(amountInCents || 0) / 100);
}

function formatDate(date?: string) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getFullUrl(path?: string | null) {
  if (!path) return "";

  if (path.startsWith("http")) return path;

  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "paid":
      return "Payé";
    case "pending":
      return "En attente";
    case "failed":
      return "Échec";
    case "transferred":
      return "Transféré";
    case "partial":
      return "Partiel";
    case "in progress":
      return "En cours";
    case "shipped":
      return "Expédiée";
    case "delivered":
      return "Livrée";
    case "canceled":
      return "Annulée";
    default:
      return status || "-";
  }
}

function getBadgeClass(status?: string) {
  switch (status) {
    case "paid":
    case "transferred":
    case "delivered":
      return "bg-green-100 text-green-700";
    case "pending":
    case "in progress":
      return "bg-orange-100 text-orange-700";
    case "partial":
    case "shipped":
      return "bg-blue-100 text-blue-700";
    case "failed":
    case "canceled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getOrderSearchContent(order: any) {
  const vendorInvoice = order?.invoices?.vendor_to_customer;
  const commissionInvoice = order?.invoices?.platform_commission;
  const products = order?.products || [];

  return [
    order?.order_id,
    order?.customer?.name,
    order?.customer?.email,
    order?.payment_status,
    order?.transfer_status,
    order?.deliver_follow,
    vendorInvoice?.invoice_number,
    commissionInvoice?.invoice_number,
    ...products.map((product: any) => product?.title || product?.label),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const LaboratoryInvoicesClient = ({ data }: Props) => {
  const [search, setSearch] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [openOrderId, setOpenOrderId] = useState<number | string | null>(null);

  const orders = data?.orders || [];
  const summary = data?.summary || {};
  const laboratory = data?.laboratory || {};

  const filteredOrders = useMemo(() => {
    return [...orders]
      .sort((a: any, b: any) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .filter((order: any) => {
        const orderDate = new Date(order.date).toISOString().split("T")[0];

        if (filterStartDate && orderDate < filterStartDate) return false;
        if (filterEndDate && orderDate > filterEndDate) return false;

        const query = search.trim().toLowerCase();

        if (query && !getOrderSearchContent(order).includes(query)) {
          return false;
        }

        return true;
      });
  }, [orders, search, filterStartDate, filterEndDate]);
  const exportAccountingExcel = () => {
    const rows = filteredOrders.map((order: any) => {
      const vendorInvoice = order?.invoices?.vendor_to_customer;
      const commissionInvoice = order?.invoices?.platform_commission;

      return {
        "Date commande": formatDate(order.date),
        Client: order.customer?.name || "",
        "Email client": order.customer?.email || "",
        "Statut commande": getStatusLabel(order.deliver_follow),
        "Statut transfert": getStatusLabel(order.transfer_status),

        "Facture client": vendorInvoice?.invoice_number || "",
        "Date facture client": formatDate(vendorInvoice?.issued_at),
        "Total facture client TTC":
          Number(order.amounts?.gross_amount || 0) / 100,
        "TVA facture client": Number(order.amounts?.tax_amount || 0) / 100,
        "Livraison TTC": Number(order.amounts?.shipping_amount || 0) / 100,

        "Facture commission": commissionInvoice?.invoice_number || "",
        "Commission HT": Number(order.amounts?.commission_amount || 0) / 100,
        "Total facture commission":
          Number(order.amounts?.platform_invoice_total || 0) / 100,

        "Net transféré labo":
          Number(order.amounts?.net_transferred_amount || 0) / 100,

        "ID transfert Stripe": order?.stripe?.transfer_id || "",
        "ID paiement Stripe": order?.stripe?.payment_intent_id || "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 16 },
      { wch: 25 },
      { wch: 30 },
      { wch: 18 },
      { wch: 18 },
      { wch: 24 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 },
      { wch: 16 },
      { wch: 24 },
      { wch: 16 },
      { wch: 24 },
      { wch: 18 },
      { wch: 30 },
      { wch: 30 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Comptabilité");

    const start = filterStartDate || "debut";
    const end = filterEndDate || "aujourdhui";

    XLSX.writeFile(workbook, `export-comptabilite-${start}-${end}.xlsx`);
  };
  const downloadAllInvoicesZip = async () => {
    const zip = new JSZip();

    const invoicesToDownload = filteredOrders.flatMap((order: any) => {
      const vendorInvoice = order?.invoices?.vendor_to_customer;
      const commissionInvoice = order?.invoices?.platform_commission;

      return [vendorInvoice, commissionInvoice]
        .filter((invoice: any) => invoice?.pdf_url)
        .map((invoice: any) => ({
          orderId: order.order_id,
          invoiceNumber: invoice.invoice_number || `facture-${invoice.id}`,
          type: invoice.type,
          url: getFullUrl(invoice.pdf_url),
        }));
    });

    if (!invoicesToDownload.length) {
      alert("Aucune facture PDF disponible pour la période sélectionnée.");
      return;
    }

    try {
      await Promise.all(
        invoicesToDownload.map(async (invoice: any) => {
          const response = await fetch(invoice.url);

          if (!response.ok) {
            console.error("Impossible de télécharger la facture :", invoice);
            return;
          }

          const blob = await response.blob();

          const folder =
            invoice.type === "platform_commission"
              ? "factures-commission"
              : "factures-clients";

          const safeFileName = `${invoice.invoiceNumber}`
            .replaceAll("/", "-")
            .replaceAll("\\", "-")
            .replaceAll(" ", "_");

          zip.file(`${folder}/${safeFileName}.pdf`, blob);
        }),
      );

      const zipBlob = await zip.generateAsync({ type: "blob" });

      const start = filterStartDate || "debut";
      const end = filterEndDate || "aujourdhui";

      saveAs(zipBlob, `factures-${start}-${end}.zip`);
    } catch (error) {
      console.error("Erreur génération ZIP factures :", error);
      alert("Une erreur est survenue pendant le téléchargement des factures.");
    }
  };
  const hasActiveFilters = search || filterStartDate || filterEndDate;

  const resetFilters = () => {
    setSearch("");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  if (data?.error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
        Impossible de charger les factures du laboratoire.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-2xl font-bold text-gray-900">
          Factures & comptabilité
        </p>

        <p className="text-sm text-gray-500 mt-1">
          Suivi comptable des commandes liées à{" "}
          <span className="font-semibold">
            {laboratory.legalName || laboratory.name || "votre laboratoire"}
          </span>
          .
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs uppercase font-semibold text-gray-500">
            Commandes
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {summary.orders_count || 0}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs uppercase font-semibold text-gray-500">
            CA TTC
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {formatMoney(summary.gross_amount)}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs uppercase font-semibold text-gray-500">
            Commissions
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {formatMoney(summary.commission_amount)}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs uppercase font-semibold text-gray-500">
            Net labo
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {formatMoney(summary.net_transferred_amount)}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="text-sm font-medium">Rechercher</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Client, produit, facture..."
              className="w-full p-2 mt-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Date de début</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full p-2 mt-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Date de fin</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full p-2 mt-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 text-sm text-blue-600 font-semibold hover:underline"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <p className="text-sm text-gray-500">
          {filteredOrders.length} commande
          {filteredOrders.length > 1 ? "s" : ""} affichée
          {filteredOrders.length > 1 ? "s" : ""}.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={exportAccountingExcel}
            disabled={filteredOrders.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Exporter en Excel
          </button>

          <button
            type="button"
            onClick={downloadAllInvoicesZip}
            disabled={filteredOrders.length === 0}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Télécharger les factures
          </button>
        </div>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order: any) => {
            const vendorInvoice = order?.invoices?.vendor_to_customer;
            const commissionInvoice = order?.invoices?.platform_commission;
            const isOpen = openOrderId === order.order_id;

            return (
              <div
                key={order.order_id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <p className="text-sm font-bold text-gray-900">
                        Commande du {formatDate(order.date)}
                      </p>

                      <span
                        className={`px-2 py-1 text-[11px] rounded-full font-semibold ${getBadgeClass(
                          order.deliver_follow,
                        )}`}
                      >
                        {getStatusLabel(order.deliver_follow)}
                      </span>

                      <span
                        className={`px-2 py-1 text-[11px] rounded-full font-semibold ${getBadgeClass(
                          order.transfer_status,
                        )}`}
                      >
                        {getStatusLabel(order.transfer_status)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500">
                      Client :{" "}
                      <span className="font-semibold text-gray-700">
                        {order.customer?.name || "Client"}
                      </span>
                    </p>

                    <p className="text-xs text-gray-400">
                      {order.customer?.email}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">CA TTC</p>
                      <p className="font-bold">
                        {formatMoney(order.amounts?.gross_amount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Commission</p>
                      <p className="font-bold">
                        {formatMoney(order.amounts?.commission_amount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Net labo</p>
                      <p className="font-bold">
                        {formatMoney(order.amounts?.net_transferred_amount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">TVA facture</p>
                      <p className="font-bold">
                        {formatMoney(order.amounts?.tax_amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-fit">
                    {vendorInvoice?.pdf_url && (
                      <a
                        href={getFullUrl(vendorInvoice.pdf_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg text-center hover:bg-blue-700"
                      >
                        Facture client
                      </a>
                    )}

                    {commissionInvoice?.pdf_url && (
                      <a
                        href={getFullUrl(commissionInvoice.pdf_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded-lg text-center hover:bg-gray-900"
                      >
                        Facture commission
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setOpenOrderId(isOpen ? null : order.order_id)
                      }
                      className="text-xs text-blue-600 font-semibold hover:underline"
                    >
                      {isOpen ? "Masquer le détail" : "Voir le détail"}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-100 rounded-lg p-4">
                        <p className="text-sm font-bold mb-3">
                          Produits vendus
                        </p>

                        <div className="space-y-2">
                          {(order.products || []).map(
                            (product: any, index: number) => (
                              <div
                                key={`${product.productId}-${index}`}
                                className="flex justify-between gap-3 text-sm border-b border-gray-100 pb-2 last:border-b-0"
                              >
                                <div>
                                  <p className="font-semibold">
                                    {product.title || product.label}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Quantité : {product.quantity}
                                  </p>
                                </div>

                                <p className="font-semibold">
                                  {formatMoney(product.totalAmount)}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      <div className="bg-white border border-gray-100 rounded-lg p-4">
                        <p className="text-sm font-bold mb-3">
                          Détail comptable
                        </p>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Produits TTC</span>
                            <strong>
                              {formatMoney(
                                vendorInvoice?.products_amount ||
                                  order.amounts?.gross_amount,
                              )}
                            </strong>
                          </div>

                          <div className="flex justify-between">
                            <span>Livraison TTC</span>
                            <strong>
                              {formatMoney(order.amounts?.shipping_amount)}
                            </strong>
                          </div>

                          <div className="flex justify-between">
                            <span>Commission plateforme</span>
                            <strong>
                              {formatMoney(order.amounts?.commission_amount)}
                            </strong>
                          </div>

                          <div className="flex justify-between">
                            <span>Total facture commission</span>
                            <strong>
                              {formatMoney(
                                order.amounts?.platform_invoice_total,
                              )}
                            </strong>
                          </div>

                          <div className="flex justify-between pt-2 border-t border-gray-100">
                            <span>Net transféré au labo</span>
                            <strong className="text-green-700">
                              {formatMoney(
                                order.amounts?.net_transferred_amount,
                              )}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 bg-white border border-gray-100 rounded-lg p-4">
                      <p className="text-sm font-bold mb-3">
                        Documents associés
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="border border-gray-100 rounded-lg p-3">
                          <p className="text-sm font-semibold">
                            Facture labo → client
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            {vendorInvoice?.invoice_number || "Non disponible"}
                          </p>

                          {vendorInvoice?.pdf_url ? (
                            <a
                              href={getFullUrl(vendorInvoice.pdf_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 font-semibold hover:underline"
                            >
                              Télécharger le PDF
                            </a>
                          ) : (
                            <p className="text-sm text-gray-400">
                              PDF indisponible
                            </p>
                          )}
                        </div>

                        <div className="border border-gray-100 rounded-lg p-3">
                          <p className="text-sm font-semibold">
                            Facture commission plateforme
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            {commissionInvoice?.invoice_number ||
                              "Non disponible"}
                          </p>

                          {commissionInvoice?.pdf_url ? (
                            <a
                              href={getFullUrl(commissionInvoice.pdf_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 font-semibold hover:underline"
                            >
                              Télécharger le PDF
                            </a>
                          ) : (
                            <p className="text-sm text-gray-400">
                              PDF indisponible
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-900 font-semibold mb-2">
            Aucune facture trouvée
          </p>
          <p className="text-sm text-gray-500">
            Les commandes et factures de votre laboratoire apparaîtront ici.
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LaboratoryInvoicesClient;
