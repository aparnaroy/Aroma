import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [MatIcon, CommonModule],
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.scss']
})
export class RatingComponent {
  @Input() rating!: number;
  @Input() editable: boolean = false;
  @Output() ratingChange = new EventEmitter<number>();

  setRating(newRating: number): void {
    if (this.editable) {
      this.rating = newRating;
      this.ratingChange.emit(this.rating);
    }
  }
}