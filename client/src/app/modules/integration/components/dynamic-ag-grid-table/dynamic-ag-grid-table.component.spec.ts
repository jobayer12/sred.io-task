import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicAgGridTableComponent } from './dynamic-ag-grid-table.component';

describe('DynamicAgGridTableComponent', () => {
  let component: DynamicAgGridTableComponent;
  let fixture: ComponentFixture<DynamicAgGridTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DynamicAgGridTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicAgGridTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
