import { ReservationStatus, ReservationType } from 'types/Reservation';

export const RESERVATION_STATUSES = [
  { key: ReservationStatus.SCHEDULED, value: 'reservations.status_scheduled' },
  { key: ReservationStatus.DONE, value: 'reservations.status_done' },
  { key: ReservationStatus.INACTIVE, value: 'reservations.status_inactive' },
  { key: ReservationStatus.CANCELLED, value: 'reservations.status_cancelled' },
  { key: ReservationStatus.EXPIRED, value: 'reservations.status_expired' },
  { key: ReservationStatus.IN_PROGRESS, value: 'reservations.status_in_progress' },
];

export const RESERVATION_TYPES = [
  { key: ReservationType.RESERVE_NOW, value: 'reservations.types.reserve_now' },
  { key: ReservationType.PLANNED_RESERVATION, value: 'reservations.types.planned_reservation' },
];
