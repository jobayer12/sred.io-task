import {Component, Inject, OnInit} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-global-search-dialog',
  templateUrl: './global-search-dialog.component.html',
  styleUrls: ['./global-search-dialog.component.scss']
})
export class GlobalSearchDialogComponent implements OnInit {
  
  searchForm = new FormControl('', [Validators.required, Validators.minLength(2)]);

  constructor(public dialogRef: MatDialogRef<GlobalSearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string) {
      this.searchForm.setValue(data);
    }

  ngOnInit(): void {
    
  }

  onOnClick(): void {
    this.dialogRef.close({search: this.searchForm.getRawValue()});
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

}
