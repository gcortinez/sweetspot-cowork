"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import {
  CreditCard,
  Download,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const BillingPage: React.FC = () => {
  const { t } = useI18n();
  const [currentPlan] = useState({
    name: "Professional",
    price: 299,
    currency: "MXN",
    billing: "monthly",
    features: [
      "Acceso ilimitado a espacios",
      "10 horas de salas de reuniones",
      "WiFi de alta velocidad",
      "Café y té ilimitado",
      "Casillero personal",
      "Soporte prioritario",
    ],
    nextBilling: "2024-02-15",
  });

  const [paymentMethods] = useState([
    {
      id: "1",
      type: "card",
      brand: "Visa",
      last4: "4242",
      expiryMonth: 12,
      expiryYear: 2027,
      isDefault: true,
    },
    {
      id: "2",
      type: "card",
      brand: "Mastercard",
      last4: "8888",
      expiryMonth: 6,
      expiryYear: 2026,
      isDefault: false,
    },
  ]);

  const [invoices] = useState([
    {
      id: "INV-001",
      date: "2024-01-15",
      amount: 299,
      currency: "MXN",
      status: "paid",
      description: "Suscripción Professional - Enero 2024",
    },
    {
      id: "INV-002",
      date: "2023-12-15",
      amount: 299,
      currency: "MXN",
      status: "paid",
      description: "Suscripción Professional - Diciembre 2023",
    },
    {
      id: "INV-003",
      date: "2023-11-15",
      amount: 299,
      currency: "MXN",
      status: "paid",
      description: "Suscripción Professional - Noviembre 2023",
    },
  ]);

  const plans = [
    {
      name: "Basic",
      price: 199,
      currency: "MXN",
      features: [
        "5 días al mes",
        "2 horas de salas de reuniones",
        "WiFi básico",
        "Café y té",
      ],
    },
    {
      name: "Professional",
      price: 299,
      currency: "MXN",
      features: [
        "Acceso ilimitado",
        "10 horas de salas de reuniones",
        "WiFi de alta velocidad",
        "Café y té ilimitado",
        "Casillero personal",
        "Soporte prioritario",
      ],
      current: true,
    },
    {
      name: "Enterprise",
      price: 499,
      currency: "MXN",
      features: [
        "Todo de Professional",
        "Salas de reuniones ilimitadas",
        "Oficina privada 2 horas/día",
        "Servicios de impresión",
        "Recepción de correspondencia",
        "Soporte 24/7",
      ],
    },
  ];

  return (
    <div className="h-full bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface-primary border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("common.back")}
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-h1 font-semibold text-gray-900">
                  {t("profile.billing")}
                </h1>
                <p className="text-sm sm:text-body text-gray-600 mt-1">
                  {t("billing.manageSubscription")}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button variant="secondary" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                {t("billing.downloadInvoices")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Current Plan */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("billing.currentPlan")}
              </h3>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {currentPlan.name}
                </Badge>
                <span className="text-2xl font-bold text-gray-900">
                  ${currentPlan.price} {currentPlan.currency}
                </span>
                <span className="text-gray-600">/ {t("billing.monthly")}</span>
              </div>
            </div>
            <Button variant="secondary">
              {t("billing.changePlan")}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t("billing.features")}</h4>
              <ul className="space-y-2">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {t("billing.nextBilling")}
                  </p>
                  <p className="text-sm text-blue-700">{currentPlan.nextBilling}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    {t("billing.status")}
                  </p>
                  <p className="text-sm text-green-700">{t("billing.active")}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Available Plans */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {t("billing.availablePlans")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-6 rounded-lg border-2 transition-all ${
                  plan.current
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {plan.current && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                    {t("billing.current")}
                  </Badge>
                )}
                
                <div className="text-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600"> {plan.currency}/mes</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.current ? "secondary" : "default"}
                  disabled={plan.current}
                >
                  {plan.current ? t("billing.current") : t("billing.selectPlan")}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("billing.paymentMethods")}
            </h3>
            <Button variant="secondary" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t("billing.addPaymentMethod")}
            </Button>
          </div>

          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {method.brand} •••• {method.last4}
                      </span>
                      {method.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          {t("billing.default")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {t("billing.expires")} {method.expiryMonth}/{method.expiryYear}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Billing History */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {t("billing.billingHistory")}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    {t("billing.invoice")}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    {t("billing.date")}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    {t("billing.amount")}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    {t("billing.status")}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">
                    {t("billing.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{invoice.id}</p>
                        <p className="text-sm text-gray-600">{invoice.description}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{invoice.date}</td>
                    <td className="py-3 px-4 text-gray-900 font-medium">
                      ${invoice.amount} {invoice.currency}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {t("billing.paid")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        {t("billing.download")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BillingPage;