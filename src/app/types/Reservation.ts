import { Car, CarCatalog } from './Car';
import { ChargingStation, Connector } from './ChargingStation';
import { TableData } from './Table';
import { Tag } from './Tag';
import { User } from './User';

export interface Reservation extends TableData {
  id: number;
  timestamp: Date;
  chargeBoxID: string;
  connectorID: number;
  expiryDate: Date;
  userID: string;
  tagID: string;
  status: string;
}

export interface ReserveNow {
  user: User;
  expiryDate: Date;
  tagID: string;
  parentTagID?: string;
  reservationID: number;
}

export interface CancelReservation {
  reservationID: number;
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
  reservationID: number;
}

export interface CancelReservationDialogData extends TableData {
  chargingStation: ChargingStation;
  connector: Connector;
  user: User;
}
