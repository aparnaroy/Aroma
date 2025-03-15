import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RecipeModel } from '../../models/recipes.model';
import { RecipeService } from '../../services/recipe.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RatingComponent } from '../../components/rating/rating.component';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { B, COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { ChangeDetectionStrategy, computed, model, signal, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-recipe',
  standalone: true,
  imports: [MatCardModule, CommonModule, FormsModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatSnackBarModule, MatIconModule, RatingComponent, MatDialogModule, MatAutocompleteModule, MatChipsModule],
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeComponent implements OnInit {
  recipe!: RecipeModel;
  tempRecipe!: RecipeModel;
  originalRecipe!: RecipeModel;
  editMode: boolean = false;
  imageLoading: boolean = false;
  userTags: { _id: string; name: string }[] = [];
  recipeId: string = '';
  originalIngredients: any[] = [];
  selectedMultiplier: number | 'custom' = 1;
  scalerMultiplier: number = 1;
  showCustomInput: boolean = false; // Track whether the custom input is visible
  customButtonText: string = 'Custom';

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly currentTag = model('');
  readonly tags = signal<string[]>([]);
  readonly allTags = signal<string[]>([]);
  readonly announcer = inject(LiveAnnouncer);
  isCookMode: boolean = false;
  wakeLock: any = null;
  showInfo: boolean = false;


  constructor(
    private route: ActivatedRoute,
    private recipeService: RecipeService,
    private userService: UserService,

    private cdr: ChangeDetectorRef,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  async ngOnInit() {
    this.route.paramMap.subscribe(params => {
        this.recipeId = params.get('id') || 'new';
        this.loadUserTags().then(async () => {
            console.log('Recipe ID:', this.recipeId);
            if (this.recipeId === 'new') {
                this.recipe = this.recipeService.getBlankRecipe();
                this.recipe.ingredients = []; // Initialize ingredients array
                this.originalIngredients = []; // Save initial empty array for new recipes
                this.editMode = true;
                this.cdr.detectChanges(); // Manually trigger change detection
            } else if (this.recipeId) {
                try {
                    const recipe = await this.recipeService.getRecipe(this.recipeId);
                    if (recipe) {
                        this.recipe = recipe;
                        this.originalRecipe = JSON.parse(JSON.stringify(recipe)); // Store original recipe data               
                        // Initialize ingredients if not defined
                        if (!this.recipe.ingredients) {
                            this.recipe.ingredients = [];
                        }
                        // Save initial state of ingredients
                        this.originalIngredients = JSON.parse(JSON.stringify(this.recipe.ingredients));

                        this.cdr.detectChanges(); // Manually trigger change detection
                    } else {
                        this.showErrorAndNavigate();
                    }
                } catch (err) {
                    console.error('Error fetching recipe:', err);
                    this.showErrorAndNavigate();
                }
            } else {
                console.error('Recipe ID is null');
                this.showErrorAndNavigate();
            }
        }).catch(err => {
            console.error('Error loading user tags:', err);
            this.showErrorAndNavigate();
        });
    });
}

  private async loadUserTags(): Promise<void> {
    try {
      this.userTags = await this.userService.getTags();
      console.log('User tags:', this.userTags);
      const tags: string[] = this.userTags.map(tag => tag.name);
      if (this.recipeId !== 'new') {
        const recipe = await this.recipeService.getRecipe(this.recipeId);
        const tempTags: string[] = recipe.tags.map(tag => tag.name);
        this.tags.set(tempTags);
        this.allTags.set(tags.filter(tag => !tempTags.includes(tag)));
      } else {
        this.tags.set([]);
        this.allTags.set(tags);
      }
    } catch (err) {
      console.error('Error fetching user tags:', err);
    }
  }

  showErrorAndNavigate(): void {
    this.snackBar.open('Recipe does not exist', 'Close', {
      duration: 3000,
    });
    this.router.navigate(['/recipes']);
  }

  convertToFraction(quantity: number): string {
    const commonFractions = [
      { numerator: 1, denominator: 8 },
      { numerator: 1, denominator: 6 },
      { numerator: 1, denominator: 4 },
      { numerator: 1, denominator: 3 },
      { numerator: 3, denominator: 8 },
      { numerator: 1, denominator: 2 },
      { numerator: 5, denominator: 8 },
      { numerator: 2, denominator: 3 },
      { numerator: 3, denominator: 4 },
      { numerator: 5, denominator: 6 },
      { numerator: 7, denominator: 8 },
    ];

    const wholePart = Math.floor(quantity);
    const fractionPart = quantity - wholePart;

    if (fractionPart === 0) {
      return wholePart.toString();
    }

    let closestFraction = commonFractions[0];
    let closestDifference = Math.abs(fractionPart - closestFraction.numerator / closestFraction.denominator);

    for (const fraction of commonFractions) {
      const difference = Math.abs(fractionPart - fraction.numerator / fraction.denominator);
      if (difference < closestDifference) {
        closestDifference = difference;
        closestFraction = fraction;
      }
    }

    if (wholePart === 0) {
      return `${closestFraction.numerator}/${closestFraction.denominator}`;
    } else {
      return `${wholePart} ${closestFraction.numerator}/${closestFraction.denominator}`;
    }
  }

  isNaN(value: any): boolean {
    return isNaN(value);
  }

  toggleEditMode(): void {
    if (!this.editMode) {
      // Entering edit mode: create a deep copy of `recipe`
      this.tempRecipe = JSON.parse(JSON.stringify(this.recipe));
    }
    this.editMode = !this.editMode;
  }

  saveChanges(): void {
    const id = this.recipe._id;
    this.recipe.tags = this.tags().map(tag => {
      const existingTag = this.userTags.find(userTag => userTag.name === tag);
      return existingTag ? { _id: existingTag._id, name: tag } : { _id: "", name: tag };
    });
    if (id) {
      this.recipeService.updateRecipe(id, this.recipe).then(() => {
        this.toggleEditMode();
        this.cdr.detectChanges(); // Manually trigger change detection
      }).catch(err => {
        console.error('Error updating recipe:', err);
      });
    } else {
      this.recipeService.createRecipe(this.recipe).then((newRecipe) => {
        this.recipeId = newRecipe._id || '';
        this.toggleEditMode();
        this.cdr.detectChanges(); // Manually trigger change detection
        // Redirect to the new recipe page
        this.router.navigate([`/recipe/${newRecipe._id}`]);
      }).catch(err => {
        console.error('Error creating recipe:', err);
      });
    }
  }

  editRecipe(): void {
    this.toggleEditMode();
  }

  confirmDelete(): void {
    const dialogRef = this.dialog.open(DeleteConfirmationDialog);

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.deleteRecipe();
      }
    });
  }

  deleteRecipe(): void {
    const id = this.recipe._id;
    if (id) {
      this.recipeService.deleteRecipe(id).then(() => {
        this.router.navigate(['/recipes']);
      }).catch(err => {
        console.error('Error deleting recipe:', err);
      });
    } else {
      console.error('Recipe ID is null');
    }
  }

  cancelEdit(): void {
    // Revert to `tempRecipe` and exit edit mode
    if (this.tempRecipe) {
      this.recipe = JSON.parse(JSON.stringify(this.tempRecipe));
      this.editMode = false;
    } else {
      this.router.navigate(['/recipes']);
    }
  }

  validateQuantity(ingredient: any): void {
    if (ingredient.quantity < 0) {
      ingredient.quantity = 0;
    } else if (ingredient.quantity > 10) {
      ingredient.quantity = 10;
    }
  }

  toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      this.imageLoading = true;
      reader.onload = (e: any) => {
        // Simulate API call to upload the image and get the new URL
        setTimeout(() => {
          this.recipe.image = e.target.result; // Replace this with the actual URL from the API response
          this.imageLoading = false;
          this.cdr.detectChanges(); // Manually trigger change detection
        }, 2000); // Simulate a delay for the API call
      };
      reader.readAsDataURL(file);
    }
  }

  toggleCustomInput(): void {
    this.showCustomInput = true;
  }

  scaleIngredients(multiplier: number): void {
    if (!this.recipe || !this.recipe.ingredients || !this.originalIngredients) return;
  
    multiplier = Number(multiplier);
    if (isNaN(multiplier) || multiplier <= 0) {
      console.error('Invalid multiplier:', multiplier);
      return;
    }
  
    this.recipe.ingredients = this.originalIngredients.map(ingredient => ({
      ...ingredient,
      quantity: ingredient.quantity * multiplier
    }));
  
    this.selectedMultiplier = multiplier; // Update selected multiplier
    this.showCustomInput = false;
  }
  
  applyCustomMultiplier(): void {
    if (!this.recipe || !this.recipe.ingredients || !this.originalIngredients) return;
  
    const multiplier = Number(this.scalerMultiplier);
    if (isNaN(multiplier) || multiplier <= 0) {
      console.error('Invalid multiplier:', multiplier);
      return;
    }
  
    this.recipe.ingredients = this.originalIngredients.map(ingredient => ({
      ...ingredient,
      quantity: ingredient.quantity * multiplier
    }));
  
    this.selectedMultiplier = 'custom'; // Update selected multiplier to 'custom'
    this.customButtonText = `${multiplier}x`;
    this.showCustomInput = false;
  }

  addIngredient(): void {
    if (this.recipe && this.recipe.ingredients) {
      this.recipe.ingredients.push({ name: '', quantity: 0, unitOfMeasure: '' });
    }
  }

  removeIngredient(index: number): void {
    if (this.recipe && this.recipe.ingredients) {
      this.recipe.ingredients.splice(index, 1);
    }
  }

  addInstruction(): void {
    this.recipe.instructions.push('');
  }

  removeInstruction(index: number): void {
    this.recipe.instructions.splice(index, 1);
  }

  trackByFn(index: number, item: any): number {
    return index; // or item.id
  }

  copyToClipboard(text: string) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    // Show the copy message
    const messageElement = document.getElementById('copy-message');
    if (messageElement) {
      messageElement.classList.remove('hidden');

      // Start the animation
      setTimeout(() => {
        messageElement.classList.add('hidden');
      }, 2000); // Adjust the duration as desired
    }
  }

  async cookMode() {
    this.isCookMode = !this.isCookMode;

    // Use Screen Wake Lock API to keep screen on when cook mode is on
    if (this.isCookMode) {
      // Request wake lock to keep the screen on
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('Screen wake lock acquired');
      } catch (err) {
        console.error('Failed to acquire screen wake lock:', err);
      }
    } else {
      // Release wake lock to allow screen sleep again
      if (this.wakeLock) {
        this.wakeLock.release();
        this.wakeLock = null;
        console.log('Screen wake lock released');
      }
    }
  }

  toggleInfo() {
    this.showInfo = !this.showInfo;
    if (this.showInfo) {
      // Add a click listener to detect outside clicks
      document.addEventListener('click', this.onClickOutside.bind(this));
    } else {
      // Remove the click listener
      document.removeEventListener('click', this.onClickOutside.bind(this));
    }
  }

  // Handle clicks outside the info box
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    const infoBox = document.querySelector('.info-box');
    const infoButton = document.querySelector('.info-button');

    if (
      infoBox &&
      infoButton &&
      !infoBox.contains(target) && // Click is not inside the info box
      !infoButton.contains(target) // Click is not on the info button
    ) {
      this.showInfo = false; // Hide the info box
      document.removeEventListener('click', this.onClickOutside.bind(this)); // Remove listener
    }
  }

  readonly filteredTags = computed(() => {
    const currentTag = this.currentTag().toLowerCase();
    return currentTag
      ? this.allTags().filter((tag) =>
        tag.toLowerCase().includes(currentTag)) : this.allTags().slice();
  });

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.tags.update((tags) => [...tags, value]);
    }
    event.chipInput!.clear();
    this.currentTag.set('');
  }

  remove(tag: string): void {
    this.tags.update((tags) => {
      const index = tags.indexOf(tag);
      if (index < 0) {
        return tags;
      }
      tags.splice(index, 1);
      this.announcer.announce(`Removed tag ${tag}`);
      return [...tags];
    });
    if (this.userTags.some(userTag => userTag.name === tag)) {
      this.allTags.update((tags) => [...tags, tag]);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const selectedTag = event.option.viewValue;
    this.tags.update((tags) => [...tags, selectedTag]);
    this.allTags.update((tags) => tags.filter(tag => tag !== selectedTag));
    this.currentTag.set('');
    event.option.deselect();
  }
}

@Component({
  selector: 'delete-confirmation-dialog',
  template: `
    <div class="confirm-box">
      <h2>Confirm Delete</h2>
      <p>Are you sure you want to delete this recipe?</p>
      <div class="actions">
        <button mat-button class="cancel" (click)="onCancel()">Cancel</button>
        <button mat-button class="confirm" (click)="onConfirm()">Delete</button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-box {
      max-width: 400px;
      margin: auto;
      padding: 1.5rem;
      background-color: var(--bg-color);
      border-radius: 8px;
      border: 1px solid var(--light-gray);
      box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      color: var(--standard-text-color);
    }

    h2 {
      font-size: 1.6rem;
      margin: 0;
      color: var(--standard-text-color);
    }

    p {
      font-size: 1rem;
      margin: 1rem 0;
      color: var(--standard-light-text-color);
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      width: 100%;

      button {
        padding: 0.5rem 1rem;
        font-weight: bold;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;

        &.confirm {
          background-color: #bf2e1c;
          color: #fff;

          &:hover {
            background-color: #ef2828;
          }
        }

        &.cancel {
          background-color: #ddd;
          color: #333;

          &:hover {
            background-color: #ccc;
          }
        }
      }
    }
  `]
})
export class DeleteConfirmationDialog {
  constructor(public dialogRef: MatDialogRef<DeleteConfirmationDialog>) {}

  onConfirm(): void {
    this.dialogRef.close('confirm');
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}