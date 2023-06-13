import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { CentralServerService } from 'services/central-server.service';
import { ComponentService } from 'services/component.service';
import { DialogService } from 'services/dialog.service';
import { MessageService } from 'services/message.service';
import { SpinnerService } from 'services/spinner.service';
import { WindowService } from 'services/window.service';
import { TableAutoRefreshAction } from 'shared/table/actions/table-auto-refresh-action';
import { TableRefreshAction } from 'shared/table/actions/table-refresh-action';
import { TableDataSource } from 'shared/table/table-data-source';
import { ReservationDataResult } from 'types/DataResult';
import { Reservation, ReservationButtonAction } from 'types/Reservation';
import { TableActionDef, TableColumnDef, TableDef, TableFilterDef } from 'types/Table';
import { TenantComponents } from 'types/Tenant';
import { IssuerFilter } from 'shared/table/filters/issuer-filter';
import { SiteTableFilter } from 'shared/table/filters/site-table-filter';
import { SiteAreaTableFilter } from 'shared/table/filters/site-area-table-filter';
import { CompanyTableFilter } from 'shared/table/filters/company-table-filter';
import { ReservationsAuthorizations } from 'types/Authorization';
import { TableEditReservationAction } from 'shared/table/actions/reservations/table-edit-reservation-action';
import { TableViewReservationAction, TableViewReservationActionDef } from 'shared/table/actions/reservations/table-view-reservation-action';
import { TableCancelReservationAction } from 'shared/table/actions/reservations/table-cancel-reservation-action';
import { TableDeleteReservationAction } from 'shared/table/actions/reservations/table-delete-reservation-action';
import { TableExportReservationsAction } from 'shared/table/actions/reservations/table-export-reservations-action';
import { TableCreateReservationAction } from 'shared/table/actions/reservations/table-create-reservation-action';
import { AppDatePipe } from 'shared/formatters/app-date.pipe';
import { DateRangeTableFilter } from 'shared/table/filters/date-range-table-filter';
import { Utils } from '../../../utils/Utils';
import { ReservationDialogComponent } from '../reservation/reservation-dialog.component';

@Injectable()
export class ReservationsListTableDataSource extends TableDataSource<Reservation> {
  private readonly isOrganizationComponentActive: boolean;

  private editAction = new TableEditReservationAction().getActionDef();
  private viewAction = new TableViewReservationAction().getActionDef();
  private cancelAction = new TableCancelReservationAction().getActionDef();
  private deleteAction = new TableDeleteReservationAction().getActionDef();

  private canExport = new TableExportReservationsAction().getActionDef();
  private canCreate = new TableCreateReservationAction().getActionDef();

  private issuerFilter: TableFilterDef;
  private siteFilter: TableFilterDef;
  private siteAreaFilter: TableFilterDef;
  private companyFilter: TableFilterDef;
  private userFilter: TableFilterDef;
  private dateRangeFilter: TableFilterDef;

  private reservationsAuthorizations: ReservationsAuthorizations;

  public constructor(
    public spinnerService: SpinnerService,
    public translateService: TranslateService,
    private messageService: MessageService,
    private router: Router,
    private centralServerService: CentralServerService,
    private componentService: ComponentService,
    private datePipe: AppDatePipe,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private windowService: WindowService
  ) {
    super(spinnerService, translateService);
    this.isOrganizationComponentActive = this.componentService.isActive(TenantComponents.ORGANIZATION);
    if (this.isOrganizationComponentActive) {
      this.setStaticFilters([{
        WithSite: true,
        WithSiteArea: true,
        WithUser: true
      }]);
    }
    this.initDataSource();
  }

  public loadDataImpl(): Observable<ReservationDataResult> {
    return new Observable((observer) => {
      this.centralServerService.getReservations(this.buildFilterValues(), this.getPaging(), this.getSorting()).subscribe({
        next: (reservations) => {
          this.reservationsAuthorizations = {
            canListSiteAreas: Utils.convertToBoolean(reservations.canListSiteAreas ?? true),
            canListSites: Utils.convertToBoolean(reservations.canListSites ?? true),
            canListCompanies: Utils.convertToBoolean(reservations.canListCompanies ?? true),
            canListUsers: Utils.convertToBoolean(reservations.canListUsers ?? true), // e.g. as param
            canExport: Utils.convertToBoolean(reservations.canExport ?? true),
            canCreate: Utils.convertToBoolean(reservations.canCreate ?? true),
            canDelete: Utils.convertToBoolean(reservations.canDelete ?? true),
            // FIXME: Necessary?
            canListTags: Utils.convertToBoolean(reservations.canListTags ?? true),
            canUpdate: Utils.convertToBoolean(reservations.canUpdate ?? true),
            metadata: reservations.metadata
          };
          this.siteFilter.visible = this.reservationsAuthorizations.canListSites;
          this.siteAreaFilter.visible = this.reservationsAuthorizations.canListSiteAreas;
          this.companyFilter.visible = this.reservationsAuthorizations.canListCompanies;
          // this.userFilter.visible = this.reservationsAuthorizations.canListUsers;
          this.dateRangeFilter.visible = this.reservationsAuthorizations.canListTags;

          this.canExport.visible = this.reservationsAuthorizations.canExport;
          this.canCreate.visible = this.reservationsAuthorizations.canCreate;

          const tableDef = this.getTableDef();
          tableDef.rowDetails.additionalParameters = {
            projectFields: reservations.projectFields
          };
          observer.next(reservations);
          observer.complete();
        },
        error: (error) => {
          Utils.handleHttpError(error, this.router, this.messageService, this.centralServerService, 'general.error_backend');
          observer.error(error);
        },
      });
    });
  }

  public buildTableDef(): TableDef {
    return {
      search: {
        enabled: true,
      },
      rowSelection: {
        enabled: false,
        multiple: false,
      },
      rowDetails: {
        enabled: false
      },
      hasDynamicRowAction: true
    };
  }

  public buildTableColumnDefs(): TableColumnDef[] {
    return [
      {
        id: 'id',
        name: 'reservations.id',
        sortable: true,
        headerClass: 'col-5p',
        class: 'col-5p',
      },
      {
        id: 'createdOn',
        name: 'reservations.created_on',
        headerClass: 'col-15p',
        class: 'col-15p',
        sorted: true,
        direction: 'desc',
        formatter: (created_on: Date) => this.datePipe.transform(created_on, 'E, d  MMMM y, HH:mm'),
      },
      {
        id: 'chargingStationId',
        name: 'reservations.chargingstation_id',
        headerClass: 'col-20p',
        class: 'col-20p',
      },
      {
        id: 'connectorId',
        name: 'reservations.connector_id',
        headerClass: 'col-10p',
        class: 'col-10p',
        formatter: (connectorId: number) => connectorId === 0 ? '0' : Utils.getConnectorLetterFromConnectorID(connectorId),
      },
      {
        id: 'expiryDate',
        name: 'reservations.expiry_date',
        headerClass: 'col-15p',
        class: 'col-15p',
        formatter: (expiryDate: Date) => this.datePipe.transform(expiryDate, 'E, d  MMMM y, HH:mm'),
      },
      {
        id: 'tagId',
        name: 'reservations.tag_id',
        headerClass: 'col-10p',
        class: 'col-10p',
      },
      {
        id: 'status',
        name: 'reservations.status',
        headerClass: 'col-20p',
        class: 'col-20p',
      },
      {
        id: 'type',
        name: 'reservations.type',
        sortable: true,
        headerClass: 'col-20p',
        class: 'col-20p',
      },
    ];
  }

  public buildTableActionsRightDef(): TableActionDef[] {
    return [
      new TableAutoRefreshAction(true).getActionDef(),
      new TableRefreshAction().getActionDef(),
    ];
  }

  public buildTableActionsDef(): TableActionDef[] {
    const tableActionsDef = super.buildTableActionsDef();
    return [
      this.canCreate,
      this.canExport,
      ...tableActionsDef,
    ];
  }

  public actionTriggered(actionDef: TableActionDef) {
    switch (actionDef.id) {
      case ReservationButtonAction.CREATE_RESERVATION:
        if (actionDef.action) {
        }
        break;
      case ReservationButtonAction.CANCEL_RESERVATION:
        if (actionDef.action) {

        }
        break;
    }
  }

  public rowActionTriggered(actionDef: TableActionDef, reservation: Reservation): void {
    switch (actionDef.id) {
      case ReservationButtonAction.VIEW_RESERVATION:
        if (actionDef.action) {
          (actionDef as TableViewReservationActionDef).action(
            ReservationDialogComponent, this.dialog, { dialogData: reservation, authorizations: this.reservationsAuthorizations },
            this.refreshData.bind(this)
          );
        }
        break;
      case ReservationButtonAction.EDIT_RESERVATION:
        if (actionDef.action) {
          // Do sth.
        }
        break;
      case ReservationButtonAction.CANCEL_RESERVATION:
        if (actionDef.action) {
          // Do sth.
        }
        break;
      case ReservationButtonAction.DELETE_RESERVATION:
        if (actionDef.action) {
          // Do sth.
        }
        break;
      default:
        break;
    }
  }

  public buildTableFiltersDef(): TableFilterDef[] {
    this.issuerFilter = new IssuerFilter().getFilterDef();
    this.siteFilter = new SiteTableFilter([this.issuerFilter]).getFilterDef();
    this.siteAreaFilter = new SiteAreaTableFilter([this.issuerFilter, this.siteFilter]).getFilterDef();
    this.companyFilter = new CompanyTableFilter([this.issuerFilter]).getFilterDef();
    this.dateRangeFilter = new DateRangeTableFilter({ translateService: this.translateService }).getFilterDef();
    const filters: TableFilterDef[] = [
      this.siteFilter,
      this.siteAreaFilter,
      this.companyFilter,
      this.dateRangeFilter,
    ];
    return filters;
  }

  public buildTableDynamicRowActions(reservation: Reservation): TableActionDef[] {
    const tableActionDef: TableActionDef[] = [];
    if (reservation.canUpdate) {
      tableActionDef.push(this.editAction);
    } else {
      tableActionDef.push(this.viewAction);
    }
    if (reservation.canDelete) {
      tableActionDef.push(this.deleteAction);
    }
    if (reservation.canCancel) {
      tableActionDef.push(this.cancelAction);
    }
    return tableActionDef;
  }
}
