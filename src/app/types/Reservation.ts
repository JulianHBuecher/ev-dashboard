import { Car, CarCatalog } from './Car';
import { ChargingStation, Connector } from './ChargingStation';
import { TableData } from './Table';
import { Tag } from './Tag';
import { User } from './User';

export interface Reservation extends TableData {
  id: number;
  timestamp: Date;
  chargingStationId: string;
  connectorId: number;
  expiryDate: Date;
  userId: string;
  tagId: string;
  status: string;
  type?: string;
}

export interface ReserveNow {
  user: User;
  expiryDate: Date;
  tagId: string;
  parentTagId?: string;
  reservationId: number;
}

export interface CancelReservation {
  reservationId: number;
}

export enum ReservationButtonAction {
  VIEW_RESERVATION = 'view_reservation',
  EDIT_RESERVATION = 'edit_reservation',
  CREATE_RESERVATION = 'create_reservation',
  CANCEL_RESERVATION = 'cancel_reservation'
}

export enum ReserveNowErrorCode {

}

export enum CancelReservationErrorCode {

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

export enum ReservationType {
  PLANNED = 'planned_reservation',
  NOW = 'reserve_now'
}
