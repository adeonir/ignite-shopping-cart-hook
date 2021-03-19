import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stock = (await api.get(`stock/${productId}`)).data as Stock
      
      let updatedCart = [] as Product[]
      
      if (stock.amount <= 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }
      
      const productOnCart = cart.find(product => product.id === productId)
      const product = (await api.get(`products/${productId}`)).data as Product
      
      if (!productOnCart) {
        updatedCart = [...cart, { ...product, amount: 1 }]
        
        setCart(updatedCart)
      } else {
        updatedCart = cart.map(product => product.id !== productId ? product : {...product, amount: product.amount + 1})

        setCart(updatedCart)
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productOnCart = cart.find(product => product.id === productId)
      
      if (!productOnCart) {
        toast.error('Erro na remoção do produto')
        return
      }
      
      const updatedCart = cart.filter(product => product.id !== productId)

      setCart(updatedCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = (await api.get(`stock/${productId}`)).data as Stock
      
      if (stock.amount <= 0) return
      
      if (stock.amount < amount || stock.amount <= 1) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      const updatedCart = cart.map(product => product.id !== productId ? product : {...product, amount})

      setCart(updatedCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  return useContext(CartContext);
}
