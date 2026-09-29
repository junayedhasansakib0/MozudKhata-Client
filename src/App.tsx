import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { RedirectIfAuthed, RequireAuth } from "@/features/auth/route-guards";
import { CategoriesPage } from "@/pages/categories-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { LoginPage } from "@/pages/login-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { ProductDetailPage } from "@/pages/product-detail-page";
import { ProductEditPage } from "@/pages/product-edit-page";
import { ProductNewPage } from "@/pages/product-new-page";
import { ProductsPage } from "@/pages/products-page";
import { ProfilePage } from "@/pages/profile-page";
import { RegisterPage } from "@/pages/register-page";

const router = createBrowserRouter([
  {
    // Public routes — redirect to the app if already signed in.
    element: <RedirectIfAuthed />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    // Everything else requires a session.
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "products", element: <ProductsPage /> },
          { path: "products/new", element: <ProductNewPage /> },
          { path: "products/:id", element: <ProductDetailPage /> },
          { path: "products/:id/edit", element: <ProductEditPage /> },
          { path: "categories", element: <CategoriesPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
