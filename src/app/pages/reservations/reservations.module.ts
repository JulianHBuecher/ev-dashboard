import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app.module';
import { MomentModule } from 'ngx-moment';
import { ComponentModule } from 'shared/component/component.module';
import { DialogsModule } from 'shared/dialogs/dialogs.module';
import { CommonDirectivesModule } from 'shared/directives/directives.module';
import { FormattersModule } from 'shared/formatters/formatters.module';
import { TableModule } from 'shared/table/table.module';
import { ReservationsRoutes } from './reservations.routing';
import { ReservationsComponent } from './reservations.component';
import { ReservationsListComponent } from './list/reservations-list.component';
import { ReservationsListTableDataSource } from './list/reservations-list-table-data-source';
import { ReservationComponent } from './reservation/reservation.component';
import { ReservationPropertiesComponent } from './reservation/properties/reservation-properties.component';
import { ReservationDialogComponent } from './reservation/reservation-dialog.component';
import { ReservationParametersComponent } from './reservation/parameters/reservation-parameters.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ReservationsRoutes),
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    MaterialModule,
    TableModule,
    CommonDirectivesModule,
    DialogsModule,
    MatProgressBarModule,
    FormattersModule,
    ComponentModule,
    MomentModule
  ],
  declarations: [
    ReservationsComponent,
    ReservationsListComponent,
    ReservationComponent,
    ReservationDialogComponent,
    ReservationPropertiesComponent,
    ReservationParametersComponent
  ],
  providers: [
    ReservationsListTableDataSource
  ]
})
export class ReservationsModule {

}
