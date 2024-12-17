import { CommonModule, NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ClickOutsideDirective } from '../directives/clickOutside.directive';
import { trigger, transition, style, animate } from '@angular/animations';
import { IndexeddbService } from '../services/indexeddb.service';

// Тип для категории
interface Subcategory {
  id: number;
  name: string;
  checked: boolean;
  color: string;
}

interface Category {
  id: number;
  name: string;
  checked: boolean;
  subcategories: Subcategory[];
  open: boolean;
  categoryIndeterminate: boolean; // Добавляем индикатор для состояния категории
}

@Component({
  selector: 'app-checklist',
  imports: [NgStyle, ClickOutsideDirective, CommonModule],
  templateUrl: './checklist.component.html',
  styleUrls: ['./checklist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('toggleHeight', [
      transition(':enter', [
        style({ height: '0px', opacity: 0 }), // Сначала элемент скрыт по высоте
        animate('300ms ease-out', style({ height: '*', opacity: 1 })), // Элемент плавно раскрывается
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ height: '0px', opacity: 0 })), // Элемент плавно скрывается
      ]),
    ]),
  ],
})
export class ChecklistComponent implements OnInit {
  allChecked = false; // Управляет состоянием всех чекбоксов
  allIndeterminate = false; // Управляет состоянием индикатора (некоторые выбраны)
  openChecklist = false;

  private subcategoryIdCounter = 1; // Счётчик для ID подкатегорий
  private categoryIdCounter = 1; // Счётчик для ID категорий

  checklistInfo = signal('');

  private indexeddbService = inject(IndexeddbService);

  subcategories: Omit<Subcategory, 'id'>[] = [
    { name: 'Неразобранное', checked: false, color: '#99CCFD' },
    { name: 'Переговоры', checked: false, color: '#FFFF99' },
    { name: 'Принимают решение', checked: false, color: '#FFCC66' },
    { name: 'Успешно', checked: false, color: '#CCFF66' },
  ];

  categories: Category[] = [
    {
      id: this.categoryIdCounter++,
      name: 'Продажи',
      checked: false,
      categoryIndeterminate: false, // Изначально категория не имеет состояния indeterminate
      open: false,
      subcategories: this.createSubcategories(),
    },
    {
      id: this.categoryIdCounter++,
      name: 'Сотрудники',
      checked: false,
      categoryIndeterminate: false, // Изначально категория не имеет состояния indeterminate
      open: false,
      subcategories: this.createSubcategories(),
    },
    {
      id: this.categoryIdCounter++,
      name: 'Партнёры',
      checked: false,
      categoryIndeterminate: false, // Изначально категория не имеет состояния indeterminate
      open: false,
      subcategories: this.createSubcategories(),
    },
    {
      id: this.categoryIdCounter++,
      name: 'Ивент',
      checked: false,
      categoryIndeterminate: false, // Изначально категория не имеет состояния indeterminate
      open: false,
      subcategories: this.createSubcategories(),
    },
    {
      id: this.categoryIdCounter++,
      name: 'Входящие обращения',
      checked: false,
      categoryIndeterminate: false, // Изначально категория не имеет состояния indeterminate
      open: false,
      subcategories: this.createSubcategories(),
    },
  ];

  async ngOnInit(): Promise<void> {
    await this.loadChecklistState();
  }

  async loadChecklistState(): Promise<void> {
    const savedState = await this.indexeddbService.getState();

    if (savedState) {
      this.allChecked = savedState.allChecked;
      this.allIndeterminate = savedState.allIndeterminate;
      this.categories = savedState.categories;

      this.checklistInfo.set(this.getSelectedChecklistInfo());
    }
  }

  async saveChecklistState(): Promise<void> {
    const stateToSave = {
      allChecked: this.allChecked,
      allIndeterminate: this.allIndeterminate,
      categories: this.categories,
    };

    await this.indexeddbService.saveState(stateToSave);

    const savedState = await this.indexeddbService.getState();
    this.checklistInfo.set(this.getSelectedChecklistInfo());
  }

  private createSubcategories(): Subcategory[] {
    return this.subcategories.map(
      (subcategory: Omit<Subcategory, 'id'>): Subcategory => ({
        id: this.subcategoryIdCounter++,
        name: subcategory.name,
        checked: false,
        color: subcategory.color,
      })
    );
  }

  // Переключает состояние "все выбраны" для всех категорий и подкатегорий
  toggleAllChecked(): void {
    this.allChecked = !this.allChecked; // Переключаем состояние
    this.allIndeterminate = false; // Убираем состояние индикатора
    this.categories.forEach((category) => {
      category.checked = this.allChecked;
      category.subcategories.forEach((sub) => (sub.checked = this.allChecked));
      category.categoryIndeterminate = false; // Убираем состояние indeterminate для категории
    });
    this.updateIndeterminateState(); // Обновляем состояние индикатора

    this.saveChecklistState();
  }

  // Переключает состояние выбранности для категории и её подкатегорий
  toggleCategoryChecked(category: Category): void {
    category.checked = !category.checked;
    category.subcategories.forEach((sub) => (sub.checked = category.checked));
    this.updateCategoryIndeterminateState(category); // Обновляем состояние индикатора для категории
    this.updateIndeterminateState(); // Обновляем состояние для всех чекбоксов

    this.saveChecklistState();
  }

  // Переключает состояние открытия категории и закрывает все другие категории
  toggleCategoryOpen(category: Category): void {
    // Закрываем все остальные категории
    this.categories.forEach((c) => {
      if (c !== category) {
        c.open = false; // Закрываем все остальные категории
      }
    });
    category.open = !category.open; // Переключаем состояние открытия категории
    this.saveChecklistState();
  }

  // Переключает состояние выбранности подкатегории
  toggleSubcategoryChecked(subcategory: Subcategory): void {
    subcategory.checked = !subcategory.checked;
    this.categories.forEach((category) => {
      this.updateCategoryIndeterminateState(category); // Обновляем состояние индикатора для категории
    });
    this.updateIndeterminateState(); // Обновляем состояние для всех чекбоксов

    this.saveChecklistState();
  }

  // Обновляет состояние "indeterminate" для всех чекбоксов (все выбраны, некоторые выбраны или нет)
  private updateIndeterminateState(): void {
    // Проверяем, выбраны ли все категории и подкатегории
    const allCategoriesChecked = this.categories.every(
      (category) =>
        category.checked && category.subcategories.every((sub) => sub.checked)
    );

    const someCategoriesChecked = this.categories.some(
      (category) =>
        category.checked || category.subcategories.some((sub) => sub.checked)
    );

    // Обновляем состояние для всех чекбоксов
    this.allChecked = allCategoriesChecked;
    this.allIndeterminate = someCategoriesChecked && !allCategoriesChecked;

    this.saveChecklistState();
  }

  // Обновляет состояние "indeterminate" для конкретной категории
  private updateCategoryIndeterminateState(category: Category): void {
    const allSubcategoriesChecked = category.subcategories.every(
      (subcategory) => subcategory.checked
    );

    const someSubcategoriesChecked = category.subcategories.some(
      (subcategory) => subcategory.checked
    );

    // Если все подкатегории выбраны, ставим checked
    category.checked = allSubcategoriesChecked;

    // Если хотя бы одна подкатегория выбрана, но не все, ставим indeterminate
    category.categoryIndeterminate =
      someSubcategoriesChecked && !allSubcategoriesChecked;

    this.saveChecklistState();
  }

  // Закрывает чеклист и все подкатегории
  closeChecklist(): void {
    this.openChecklist = false;
    this.closeAllSubcategories();
  }

  // Переключает состояние открытия чеклиста и закрывает все подкатегории
  checklistToggle(): void {
    this.openChecklist = !this.openChecklist;
    this.closeAllSubcategories();
  }

  // Закрывает все подкатегории
  closeAllSubcategories() {
    // Закрываем все подкатегории
    this.categories.map((category) => {
      category.open = false;
    });

    this.saveChecklistState();
  }

  // Возвращает строку с информацией о количестве выбранных категорий и подкатегорий,
  // либо возвращает "Выбрать всё" или "Снять выделение" в зависимости от состояния
  getSelectedChecklistInfo(): string {
    // Если чеклист открыт и все выбраны, отображаем "Снять выделение"
    if (this.openChecklist && this.allChecked) {
      return 'Снять выделение'; // Отображаем "Снять выделение"
    }

    // Если чеклист открыт и ничего не выбрано (allChecked === false)
    if (this.openChecklist && !this.allChecked) {
      return 'Выбрать всё'; // Отображаем "Выбрать всё"
    }

    // Подсчёт выбранных категорий
    const selectedCategoryCount = this.categories.filter(
      (category) => category.checked // Фильтруем только те категории, которые выбраны
    ).length;

    // Подсчёт выбранных подкатегорий
    const selectedSubcategoryCount = this.categories.reduce(
      (total, category) =>
        total +
        category.subcategories.filter(
          (subcategory) => subcategory.checked // Фильтруем только выбранные подкатегории
        ).length,
      0
    );

    const checklistInfo = `${selectedCategoryCount} воронки, ${selectedSubcategoryCount} этапа`;

    // Возвращаем строку с количеством выбранных категорий и подкатегорий
    return checklistInfo;
  }
}
