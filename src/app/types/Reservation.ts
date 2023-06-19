import { ReservationsAuthorizationActions } from './Authorization';
import { ChargingStation, Connector } from './ChargingStation';
import { TableData } from './Table';
import { User } from './User';

export interface Reservation extends TableData, ReservationsAuthorizationActions {
  id: number;
  createdOn: Date;
  chargingStationId: string;
  connectorId: number;
  expiryDate: Date;
  fromDate?: Date;
  toDate?: Date;
  userId?: string;
  idTag: string;
  parentIdTag?: string;
  status: ReservationStatus;
  type?: ReservationType;
}

export interface ReserveNow {
  reservationId: number;
  connectorId: number;
  expiryDate: Date;
  idTag: string;
  user: User;
  parentIdTag?: string;
}

export enum ReservationButtonAction {
  VIEW_RESERVATION = 'view_reservation',
  EDIT_RESERVATION = 'edit_reservation',
  CREATE_RESERVATION = 'create_reservation',
  CANCEL_RESERVATION = 'cancel_reservation',
  EXPORT_RESERVATIONS = 'export_reservations',
  DELETE_RESERVATION = 'delete_reservation',
}

export interface ReserveNowDialogData extends TableData {
  chargingStation: ChargingStation;
  connector: Connector;
  expiryDate: Date;
  reservationId: number;
}

export interface CancelReservationDialogData extends TableData {
  chargingStation: ChargingStation;
  connector: Connector;
  user: User;
}

export enum ReservationStatus {
  DONE = 'reservation_done',
  SCHEDULED = 'reservation_scheduled',
  IN_PROGRESS = 'reservation_in_progress',
  CANCELLED = 'reservation_cancelled',
  INACTIVE = 'reservation_inactive',
  EXPIRED = 'reservation_expired',
}

export enum ReservationType {
  PLANNED_RESERVATION = 'planned_reservation',
  RESERVE_NOW = 'reserve_now',
}
