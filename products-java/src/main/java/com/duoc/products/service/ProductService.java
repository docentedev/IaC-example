package com.duoc.products.service;

import com.duoc.products.dto.ProductDto;
import com.duoc.products.entity.ProductEntity;
import com.duoc.products.repository.ProductRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductDto> getAllProducts() {
        List<ProductEntity> dbProducts = productRepository.findAll();

        if (dbProducts.isEmpty()) {
            return buildMockProducts();
        }

        return dbProducts.stream().map(this::toDto).toList();
    }

    public Optional<ProductDto> getProductById(Long id) {
        Optional<ProductEntity> dbProduct = productRepository.findById(id);

        if (dbProduct.isPresent()) {
            return dbProduct.map(this::toDto);
        }

        return buildMockProducts().stream()
                .filter(product -> product.getId().equals(id))
                .findFirst();
    }

    private ProductDto toDto(ProductEntity entity) {
        return ProductDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .price(entity.getPrice())
                .stock(entity.getStock())
                .build();
    }

    private List<ProductDto> buildMockProducts() {
        return List.of(
                ProductDto.builder()
                        .id(1L)
                        .name("Laptop Lenovo ThinkPad")
                        .description("Laptop para desarrollo con 16GB RAM")
                        .price(899990.0)
                        .stock(12)
                        .build(),
                ProductDto.builder()
                        .id(2L)
                        .name("Mouse Logitech MX Master")
                        .description("Mouse ergonomico para productividad")
                        .price(79990.0)
                        .stock(25)
                        .build(),
                ProductDto.builder()
                        .id(3L)
                        .name("Monitor Samsung 27\"")
                        .description("Monitor IPS Full HD")
                        .price(199990.0)
                        .stock(18)
                        .build()
        );
    }
}
