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
	listAllOrders,
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
	listArticles,
	getArticleById,
	createArticle,
	updateArticle,
	deleteArticle,
} from "./article-service.js";
export {
	getPublishedRecipes,
	getRecipeBySlug,
	listRecipes,
	getRecipeById,
	createRecipe,
	updateRecipe,
	deleteRecipe,
} from "./recipe-service.js";
export {
	listUsers,
	updateUserProfile,
	deleteUserProfile,
} from "./user-service.js";
