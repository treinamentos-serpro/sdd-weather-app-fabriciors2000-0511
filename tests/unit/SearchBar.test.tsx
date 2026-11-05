import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

describe('SearchBar', () => {
  it('não dispara busca com input vazio', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    expect(screen.getByLabelText(/buscar cidade/i)).toBeRequired();
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('dispara busca com o termo digitado', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await userEvent.type(screen.getByLabelText(/buscar cidade/i), 'Lisboa');
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));
    expect(onSearch).toHaveBeenCalledWith('Lisboa');
  });

  it('informa quando o termo contém apenas espaços', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await userEvent.type(screen.getByLabelText(/buscar cidade/i), '   ');
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Informe um termo de busca.');
    expect(screen.getByLabelText(/buscar cidade/i)).toHaveAttribute('aria-invalid', 'true');
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('anuncia a contagem com a concordância correta', () => {
    render(
      <SearchBar
        onSearch={vi.fn()}
        results={[{ id: 1, name: 'Lisboa', country: 'Portugal', latitude: 38.72, longitude: -9.14 }]}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('1 cidade encontrada.');
  });
});
