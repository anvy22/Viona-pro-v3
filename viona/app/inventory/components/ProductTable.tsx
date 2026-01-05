"use client";

import { useState, useMemo, memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddProductDialog } from "./AddProductDialog";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { Edit, Trash2, Eye, Loader2 } from "lucide-react";
import type { Product } from "../../api/inventory/products/route";
import { useOrgStore } from "@/hooks/useOrgStore";

interface ProductTableProps {
  products: Product[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, product: Omit<Product, "id" | "createdAt" | "updatedAt">) => void;
  isLoading?: boolean;
}

// Memoized row component for better performance
const ProductRow = memo(({ 
  product, 
  onEdit, 
  onDeleteClick 
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onDeleteClick: (product: Product) => void;
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const stockStatus = useMemo(() => {
    if (product.stock === 0) return { label: "Out of Stock", variant: "secondary" as const };
    if (product.stock < 10) return { label: "Low Stock", variant: "destructive" as const };
    return { label: "In Stock", variant: "default" as const };
  }, [product.stock]);

  return (
    <TableRow>
      <TableCell>
        <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                if (target.parentElement) {
                  target.parentElement.innerHTML = '<div class="text-xs text-muted-foreground">No Image</div>';
                }
              }}
            />
          ) : (
            <div className="text-xs text-muted-foreground">No Image</div>
          )}
        </div>
      </TableCell>
      <TableCell className="font-medium">
        <div className="max-w-[200px] truncate" title={product.name}>
          {product.name}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground font-mono text-sm">
        {product.sku}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="min-w-[20px] font-medium">{product.stock}</span>
          {product.stock < 10 && product.stock > 0 && (
            <Badge variant="destructive" className="text-xs">
              Low
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="font-medium">{formatPrice(product.price)}</TableCell>
      <TableCell>
        <Badge
          variant={stockStatus.variant}
          className={
            product.stock > 0
              ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100"
              : ""
          }
        >
          {stockStatus.label}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
        {formatDate(product.createdAt)}
      </TableCell>
      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
        {formatDate(product.updatedAt)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/inventory/${product.id}`}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>View details</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(product)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit product</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteClick(product)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete product</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
});

ProductRow.displayName = "ProductRow";

export function ProductTable({
  products,
  onDelete,
  onUpdate,
  isLoading = false,
}: ProductTableProps) {
  
  const selectedOrgId = useOrgStore((state) => state.selectedOrgId);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setDeleteProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteProduct) {
      onDelete(deleteProduct.id);
      setDeleteProduct(null);
    }
  };

  const handleUpdateProduct = (updatedProduct: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    if (editingProduct) {
      onUpdate(editingProduct.id, updatedProduct);
      setEditingProduct(null);
    }
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Products</CardTitle>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded border">
            <div className="max-h-[calc(100vh-400px)] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="hidden lg:table-cell">Modified</TableHead>
                    <TableHead className="text-right w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        No products found. Try adjusting your filters or add your first product.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        onEdit={handleEdit}
                        onDeleteClick={handleDeleteClick}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

     
      <AddProductDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingProduct(null);
        }}
        onSave={handleUpdateProduct}
        product={editingProduct}
        orgId={selectedOrgId || ''} // Provide fallback empty string
        mode="edit"
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        product={deleteProduct}
      />
    </TooltipProvider>
  );
}