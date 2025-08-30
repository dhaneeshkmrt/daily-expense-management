import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PaymentMethodBalance {
  code: 'DC' | 'DD' | 'NC' | 'ND';
  label: string;
  balance: number;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
}

@Component({
  selector: 'app-payment-methods',
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
      <div class="grid grid-cols-2 gap-3">
        @for (method of paymentMethods(); track method.code) {
          <div [class]="'p-4 rounded-lg border ' + method.gradientFrom + ' ' + method.gradientTo + ' ' + method.borderColor">
            <div class="flex items-center justify-between">
              <div>
                <p [class]="'text-xs font-medium ' + getTextColor(method.code)">{{ method.label }}</p>
                <p [class]="'text-lg font-bold ' + getTextColorDark(method.code)">₹{{ method.balance | number:'1.0-0' }}</p>
              </div>
              <div [class]="'w-8 h-8 rounded-full flex items-center justify-center ' + getBgColor(method.code)">
                <span class="text-white text-xs font-bold">{{ method.code }}</span>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class PaymentMethodsComponent {
  protected readonly paymentMethods = signal<PaymentMethodBalance[]>([
    {
      code: 'DC',
      label: 'Dhaneesh Cash',
      balance: 5240,
      gradientFrom: 'bg-gradient-to-br from-green-50 to-green-100',
      gradientTo: '',
      borderColor: 'border-green-200'
    },
    {
      code: 'DD',
      label: 'Dhaneesh Digital',
      balance: 12680,
      gradientFrom: 'bg-gradient-to-br from-blue-50 to-blue-100',
      gradientTo: '',
      borderColor: 'border-blue-200'
    },
    {
      code: 'NC',
      label: 'Nisha Cash',
      balance: 3820,
      gradientFrom: 'bg-gradient-to-br from-pink-50 to-pink-100',
      gradientTo: '',
      borderColor: 'border-pink-200'
    },
    {
      code: 'ND',
      label: 'Nisha Digital',
      balance: 8940,
      gradientFrom: 'bg-gradient-to-br from-purple-50 to-purple-100',
      gradientTo: '',
      borderColor: 'border-purple-200'
    }
  ]);

  protected getTextColor(code: string): string {
    const colors = {
      'DC': 'text-green-800',
      'DD': 'text-blue-800',
      'NC': 'text-pink-800',
      'ND': 'text-purple-800'
    };
    return colors[code as keyof typeof colors] || 'text-gray-800';
  }

  protected getTextColorDark(code: string): string {
    const colors = {
      'DC': 'text-green-900',
      'DD': 'text-blue-900',
      'NC': 'text-pink-900',
      'ND': 'text-purple-900'
    };
    return colors[code as keyof typeof colors] || 'text-gray-900';
  }

  protected getBgColor(code: string): string {
    const colors = {
      'DC': 'bg-green-600',
      'DD': 'bg-blue-600',
      'NC': 'bg-pink-600',
      'ND': 'bg-purple-600'
    };
    return colors[code as keyof typeof colors] || 'bg-gray-600';
  }
}