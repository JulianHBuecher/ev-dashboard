import { TableColumnDef, TableDef } from '../../../types/Table';

import { CentralServerService } from '../../../services/central-server.service';
import { DataResult } from '../../../types/DataResult';
import { DialogTableDataSource } from '../dialog-table-data-source';
import { Injectable } from '@angular/core';
import { MessageService } from '../../../services/message.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Site } from '../../../types/Site';
import { SpinnerService } from '../../../services/spinner.service';
import { TranslateService } from '@ngx-translate/core';
import { Utils } from '../../../utils/Utils';

@Injectable()
export class SitesDialogTableDataSource extends DialogTableDataSource<Site> {
  constructor(
      public spinnerService: SpinnerService,
      public translateService: TranslateService,
      private messageService: MessageService,
      private router: Router,
      private centralServerService: CentralServerService) {
    super(spinnerService, translateService);
    // Init
    this.initDataSource();
  }

  public loadDataImpl(): Observable<DataResult<Site>> {
    return new Observable((observer) => {
      // Get data
      this.centralServerService.getSites(this.buildFilterValues(),
        this.getPaging(), this.getSorting()).subscribe((sites) => {
          // Ok
          observer.next(sites);
          observer.complete();
        }, (error) => {
          // No longer exists!
          Utils.handleHttpError(error, this.router, this.messageService, this.centralServerService, 'general.error_backend');
          // Error
          observer.error(error);
        });
    });
  }

  public buildTableDef(): TableDef {
    return {
      class: 'table-dialog-list',
      rowSelection: {
        enabled: true,
        multiple: true,
      },
      search: {
        enabled: true,
      },
    };
  }

  public buildTableColumnDefs(): TableColumnDef[] {
    return [
      {
        id: 'name',
        name: 'sites.name',
        class: 'text-left col-600px',
        sorted: true,
        direction: 'asc',
        sortable: true,
      },
      {
        id: 'address.city',
        name: 'general.city',
        class: 'text-left col-350px',
      },
      {
        id: 'address.country',
        name: 'general.country',
        class: 'text-left col-300px',
      },
    ];
  }
}
