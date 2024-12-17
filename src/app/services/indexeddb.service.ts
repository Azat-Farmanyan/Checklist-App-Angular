import Dexie, { Table } from 'dexie';
import { Injectable } from '@angular/core';

export interface SelectedState {
  id: number;
  state: any;
}

@Injectable({
  providedIn: 'root',
})
export class IndexeddbService extends Dexie {
  selectedState!: Table<SelectedState>;

  constructor() {
    super('ChecklistDB');
    this.version(1).stores({
      selectedState: 'id',
    });
  }

  // Сохранить состояние
  async saveState(state: any): Promise<void> {
    await this.selectedState.put({ id: 1, state });
  }

  // Получить сохранённое состояние
  async getState(): Promise<any | undefined> {
    const result = await this.selectedState.get(1);
    return result?.state;
  }

  // Удалить состояние
  async deleteState(): Promise<void> {
    await this.selectedState.delete(1);
  }

  // Проверить, существует ли сохранённое состояние
  async hasState(): Promise<boolean> {
    const result = await this.selectedState.get(1);
    return !!result;
  }
}
