import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { WishlistItem } from '../../components/WishlistItem';

const baseProps = {
  onToggleBought: () => {},
  onDeleteItem: () => {},
  onUpdateItem: () => {},
  isEditing: false,
  onEditClick: () => {},
  onCancelEdit: () => {},
  displayCurrency: 'RUB',
  exchangeRates: {},
  isSelected: false,
  onToggleSelected: () => {},
  isBulkSelected: false,
  onToggleBulkSelected: () => {},
  isMobile: false,
  onMoveItem: () => {},
  index: 0,
  totalItems: 1,
  existingCategories: [],
};

describe('WishlistItem component', () => {
  it('renders safe link for http/https and falls back to text otherwise', () => {
    const item = {
      id: '1',
      itemType: 'Электроника',
      name: 'Смартфон',
      link: 'javascript:alert(1)',
      price: 1000,
      currency: 'RUB',
      isBought: false,
      comment: 'x',
      category: 'cat',
    };
    render(<WishlistItem item={item as any} {...baseProps} />);
    const maybeLink = screen.getByText('Смартфон').closest('a');
    expect(maybeLink).toBeNull();
  });
});


