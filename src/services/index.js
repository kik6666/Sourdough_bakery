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
export {
	createOrder,
	getMyOrders,
	getOrderById,
	cancelOrder,
	updateOrderStatus,
} from "./order-service.js";
export {
	uploadProductImage,
	uploadRecipeImage,
	uploadArticleImage,
	uploadAvatar,
	deleteImage,
	getPublicUrl,
} from "./storage-service.js";
export {
	getPublishedArticles,
	getArticleBySlug,
} from "./article-service.js";
