import { KeyValue } from '../../types/GlobalType';
import {
  AnalyticsSettingsType,
  BillingSettingsType,
  PricingSettingsType,
  RefundSettingsType,
  ReservationSettingsType,
  SmartChargingSettingsType,
} from '../../types/Setting';

export const PRICING_TYPES: KeyValue[] = [
  {
    key: PricingSettingsType.SIMPLE,
    value: 'settings.pricing.simple_pricing_title',
  },
];

export const BILLING_TYPES: KeyValue[] = [
  {
    key: BillingSettingsType.STRIPE,
    value: 'settings.billing.stripe.title',
  },
];

export const REFUND_TYPES: KeyValue[] = [
  {
    key: RefundSettingsType.CONCUR,
    value: 'settings.refund.concur.title',
  },
];

export const ANALYTICS_TYPES: KeyValue[] = [
  {
    key: AnalyticsSettingsType.SAC,
    value: 'settings.analytics.sac.title',
  },
];

export const SMART_CHARGING_TYPES: KeyValue[] = [
  {
    key: SmartChargingSettingsType.SAP_SMART_CHARGING,
    value: 'settings.smart_charging.sap_smart_charging.title',
  },
];

export const RESERVATION_TYPES: KeyValue[] = [
  {
    key: ReservationSettingsType.RESERVE_NOW,
    value: 'settings.reservations.reserve_now.title',
  },
  {
    key: ReservationSettingsType.PLANNED_RESERVATION,
    value: 'settings.reservations.planned_reservation.title',
  },
];
