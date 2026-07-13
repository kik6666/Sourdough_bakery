export { supabase } from "./supabase-client.js";
export {
	getSession,
	onAuthStateChange,
	signInWithPassword,
	signUpWithPassword,
	signOut,
	getProfileById,
	updateOwnProfile,
} from "./auth-service.js";
export {
	getCart,
	addToCart,
	updateQuantity,
	removeFromCart,
	clearCart,
	getCartTotal,
} from "./cart-service.js";
