import { Component, OnInit } from '@angular/core';
import { ShoppingService } from '../../services/shopping.service';
import { ShoppingListModel } from '../../models/shopping.model';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-shopping',
  standalone: true,
  imports: [MatIcon, CommonModule, MatProgressSpinner, FormsModule],
  templateUrl: './shopping.component.html',
  styleUrls: ['./shopping.component.scss']
})
export class ShoppingComponent implements OnInit {
  shoppingLists: { [key: string]: ShoppingListModel } = {};
  selectedList: string | null = null;
  newListName: string = '';
  isLoading: boolean = false;
  editingItemIndex: number | null = null;
  editingItemName: string = '';
  message: string | null = null;

  constructor(private shoppingService: ShoppingService, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.loadShoppingLists();
  }

  loadShoppingLists(): void {
    this.isLoading = true;
    this.shoppingService.getShoppingLists().then((lists) => {
      this.shoppingLists = lists.reduce((acc, list) => {
        acc[list.name] = list;
        // Ensure items is always an array
        if (!acc[list.name].items) {
          acc[list.name].items = [];
        }
        return acc;
      }, {} as { [key: string]: ShoppingListModel });
    }).catch((err) => {
      console.error('Failed to load shopping lists', err);
    }).finally(() => {
      this.isLoading = false;
    });
  }

  onNewListNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newListName = input.value;
  }

  showMessage(msg: string): void {
    this.message = msg;
    setTimeout(() => {
      this.message = null; // Clear the message after 3 seconds
    }, 3000);
  }
  

  async addNewList(): Promise<void> {
    if (!this.newListName.trim()) {
      this.showMessage('List name cannot be empty');
      return;
    }

    const isDuplicate = Object.keys(this.shoppingLists).some(
      (listName) => listName.toLowerCase() === this.newListName.trim().toLowerCase()
    );
    if (isDuplicate) {
      this.showMessage('A list with this name already exists');
      return;
    }

    const newList: ShoppingListModel = this.shoppingService.getBlankShoppingList();
    newList.name = this.newListName;
    this.isLoading = true;

    try {
      const createdList = await this.shoppingService.createShoppingList(newList);
      this.shoppingLists[createdList.name] = createdList;
      // Ensure items is always an array
      if (!this.shoppingLists[createdList.name].items) {
        this.shoppingLists[createdList.name].items = [];
      }
      this.newListName = '';
      await this.loadShoppingLists(); // Reload the lists to ensure the new list is displayed correctly
    } catch (err) {
      console.error('Failed to create new list', err);
    } finally {
      this.isLoading = false;
    }
  }

  selectList(listName: string): void {
    this.selectedList = listName;
  }

  confirmDeleteList(listName: string): void {
    const dialogRef = this.dialog.open(DeleteConfirmationDialog);

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.deleteList(listName);
      }
    });
  }

  deleteList(listName: string): void {
    const listToDelete = this.shoppingLists[listName];
    if (!listToDelete) {
      return;
    }

    this.shoppingService.deleteShoppingList(listToDelete._id!).then(() => {
      delete this.shoppingLists[listName];
      if (this.selectedList === listName) {
        this.selectedList = null;
      }
    }).catch((err) => {
      console.error('Failed to delete list', err);
    });
  }

  addItem(itemName: string): void {
    if (!this.selectedList || !itemName.trim()) {
      return;
    }

    const newItem = {
      name: itemName,
      quantity: 1,
      unitOfMeasure: '',
      bought: false
    };

    this.shoppingLists[this.selectedList].items.push(newItem);
    this.updateSelectedList();
  }

  deleteItem(index: number): void {
    if (!this.selectedList) {
      return;
    }

    this.shoppingLists[this.selectedList].items.splice(index, 1);
    this.updateSelectedList();
  }

  editItem(index: number): void {
    this.editingItemIndex = index;
    this.editingItemName = this.shoppingLists[this.selectedList!].items[index].name;
  }

  saveItem(index: number): void {
    if (this.editingItemName.trim()) {
      this.shoppingLists[this.selectedList!].items[index].name = this.editingItemName;
      this.updateSelectedList();
      this.cancelEdit();
    }
  }

  cancelEdit(): void {
    this.editingItemIndex = null;
    this.editingItemName = '';
  }

  updateSelectedList(): void {
    if (!this.selectedList) {
      return;
    }

    const updatedList = this.shoppingLists[this.selectedList];

    this.shoppingService.updateShoppingList(updatedList._id!, updatedList).catch((err) => {
      console.error('Failed to update list', err);
    });
  }

  toggleItemBought(index: number): void {
    if (!this.selectedList) {
      return;
    }

    const selectedList = this.shoppingLists[this.selectedList];
    selectedList.items[index].bought = !selectedList.items[index].bought;
    this.updateSelectedList();
  }

  lastUpdated(listName: string): string {
    const list = this.shoppingLists[listName];
    if (!list || !list._updated) {
      return '';
    }
    return new Date(list._updated).toLocaleString();
  }
}


@Component({
  selector: 'delete-confirmation-dialog',
  template: `
    <div class="confirm-box">
      <h2>Confirm Delete</h2>
      <p>Are you sure you want to delete this list?</p>
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
  constructor(public dialogRef: MatDialogRef<DeleteConfirmationDialog>) { }

  onConfirm(): void {
    this.dialogRef.close('confirm');
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
