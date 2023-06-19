import { Component, Input, Pipe, PipeTransform } from '@angular/core';
import { RESERVATION_STATUSES } from 'shared/model/reservations.model';
import { CellContentTemplateDirective } from 'shared/table/cell-content-template/cell-content-template.directive';
import { ChipType } from 'types/GlobalType';
import { Reservation, ReservationStatus } from 'types/Reservation';

@Component({
  template: `
    <mat-chip-list [selectable]="false">
      <mat-chip [ngClass]="row.status | appReservationsFormatStatus : 'class'" [disabled]="true">
        {{ row.status | appReservationsFormatStatus : 'text' | translate }}
      </mat-chip>
    </mat-chip-list>
  `,
})
export class ReservationStatusFormatterCellComponent extends CellContentTemplateDirective {
  @Input() public row!: Reservation;
}

@Pipe({ name: 'appReservationsFormatStatus' })
export class AppReservationsFormatStatusPipe implements PipeTransform {
  public transform(reservationStatus: string, type: string) {
    if (type === 'class') {
      return this.buildReservationStatusClasses(reservationStatus);
    }
    if (type === 'text') {
      return this.buildReservationStatusText(reservationStatus);
    }
    return '';
  }

  public buildReservationStatusClasses(status: string): string {
    let classNames = 'chip-width-8em ';
    switch (status) {
      case ReservationStatus.DONE:
        classNames += this.buildStyleClass(ReservationStatus.DONE);
        break;
      case ReservationStatus.SCHEDULED:
        classNames += this.buildStyleClass(ReservationStatus.SCHEDULED);
        break;
      case ReservationStatus.CANCELLED:
        classNames += this.buildStyleClass(ReservationStatus.CANCELLED);
        break;
      case ReservationStatus.INACTIVE:
        classNames += this.buildStyleClass(ReservationStatus.INACTIVE);
        break;
      case ReservationStatus.EXPIRED:
        classNames += this.buildStyleClass(ReservationStatus.EXPIRED);
        break;
      case ReservationStatus.IN_PROGRESS:
        classNames += this.buildStyleClass(ReservationStatus.IN_PROGRESS);
        break;
      default:
        classNames += ChipType.DEFAULT;
    }
    return classNames;
  }

  public buildReservationStatusText(status: string): string {
    for (const reservationStatus of RESERVATION_STATUSES) {
      if (reservationStatus.key === status) {
        return reservationStatus.value;
      }
    }
    return '';
  }

  private buildStyleClass(status: string): string {
    return status.replace('_', '-');
  }
}
