import { createContext, ReactNode, useContext, useState } from 'react'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { Product, Stock } from '../types'

interface CartProviderProps {
  children: ReactNode
}

interface UpdateProductAmount {
  productId: number
  amount: number
}

interface CartContextData {
  cart: Product[]
  addProduct: (productId: number) => Promise<void>
  removeProduct: (productId: number) => void
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart)
    }

    return []
  })

  const addProduct = async (productId: number) => {
    try {
      const stockResponse = await api.get<Stock>(`/stock/${productId}`)
      const stock = stockResponse.data

      const productExists = cart.find(product => product.id === productId)
      const amount = productExists ? productExists.amount + 1 : 1

      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      if (productExists) {
        const updatedProduct = {
          ...productExists,
          amount,
        }

        const updatedCart = cart.map(product =>
          product.id === updatedProduct.id ? updatedProduct : product,
        )

        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } else {
        const productsResponse = await api.get<Product>(
          `/products/${productId}`,
        )
        const newProduct = { ...productsResponse.data, amount }
        const updatedCart = [...cart, newProduct]

        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }
      toast.success('Produto adicionado ao carrinho')
    } catch {
      toast.error('Erro na adi????o do produto')
    }
  }

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId)
      if (!productExists) throw new Error('Produto n??o encontrado')

      const updatedCart = cart.filter(product => product.id !== productId)
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      toast.success('Produto removido do carrinho')
    } catch {
      toast.error('Erro na remo????o do produto')
    }
  }

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) throw new Error('Quantidade inv??lida')

      const response = await api.get<Stock>(`/stock/${productId}`)
      const stock = response.data
      if (stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      const updatedCart = cart.map(product =>
        product.id === productId ? { ...product, amount } : product,
      )

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na altera????o de quantidade do produto')
    }
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextData {
  const context = useContext(CartContext)

  return context
}
