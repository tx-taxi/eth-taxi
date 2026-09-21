import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountStateFlowComponent } from '@components/account-state-flow/account-state-flow.component';
import { TxBowtieModule } from '@components/tx-bowtie-graph/tx-bowtie.module';

@NgModule({
  imports: [
    CommonModule,
    TxBowtieModule,
  ],
  declarations: [
    AccountStateFlowComponent,
  ],
  exports: [
    AccountStateFlowComponent,
  ],
})
export class AccountStateFlowModule {}
