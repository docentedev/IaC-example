package com.duoc.products.service;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.duoc.products.dto.ProductDto;
import com.duoc.products.entity.ProductEntity;
import com.duoc.products.repository.ProductRepository;

// MockitoExtension habilita @Mock y @InjectMocks en JUnit 5.
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    // Simulamos el repositorio para no depender de base de datos real en un test unitario.
    @Mock
    private ProductRepository productRepository;

    // Crea ProductService e inyecta automáticamente los mocks definidos arriba.
    @InjectMocks
    private ProductService productService;

    @Test
    void getAllProducts_returnsDbProductsMapped_whenRepositoryHasData() {
        // Arrange: construimos una entidad que "vendría" desde la BD.
        ProductEntity entity = ProductEntity.builder()
                .id(10L)
                .name("Producto DB")
                .description("Desde base")
                .price(12345.0)
                .stock(5)
                .build();

        // Arrange: definimos el comportamiento del mock.
        when(productRepository.findAll()).thenReturn(List.of(entity));

        // Act: ejecutamos el método que queremos probar.
        List<ProductDto> result = productService.getAllProducts();

        // Assert: validamos tamaño y mapeo de campos Entity -> DTO.
        assertEquals(1, result.size());
        assertEquals(10L, result.get(0).getId());
        assertEquals("Producto DB", result.get(0).getName());
        assertEquals(12345.0, result.get(0).getPrice());
    }

    @Test
    void getAllProducts_returnsMockProducts_whenRepositoryIsEmpty() {
        // Arrange: forzamos repositorio vacío.
        when(productRepository.findAll()).thenReturn(List.of());

        // Act
        List<ProductDto> result = productService.getAllProducts();

        // Assert: el servicio debe usar su fallback de productos mock.
        assertEquals(3, result.size());
        assertEquals(1L, result.get(0).getId());
        assertEquals("Laptop Lenovo ThinkPad", result.get(0).getName());
    }

    @Test
    void getProductById_returnsDbProduct_whenExistsInRepository() {
        // Arrange
        ProductEntity entity = ProductEntity.builder()
                .id(77L)
                .name("Producto puntual")
                .description("Encontrado")
                .price(999.0)
                .stock(1)
                .build();

        when(productRepository.findById(77L)).thenReturn(Optional.of(entity));

        // Act
        Optional<ProductDto> result = productService.getProductById(77L);

        // Assert: Optional debe venir presente y con datos correctos.
        assertTrue(result.isPresent());
        assertEquals(77L, result.get().getId());
        assertEquals("Producto puntual", result.get().getName());
    }

    @Test
    void getProductById_returnsMockProduct_whenNotInRepositoryButExistsInMock() {
        // Arrange: no está en BD.
        when(productRepository.findById(2L)).thenReturn(Optional.empty());

        // Act
        Optional<ProductDto> result = productService.getProductById(2L);

        // Assert: cae al mock interno y sí encuentra el id=2.
        assertTrue(result.isPresent());
        assertEquals(2L, result.get().getId());
        assertEquals("Mouse Logitech MX Master", result.get().getName());
    }

    @Test
    void getProductById_returnsEmpty_whenNotFoundInRepositoryOrMock() {
        // Arrange: no existe ni en BD ni en fallback.
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        Optional<ProductDto> result = productService.getProductById(999L);

        // Assert: Optional vacío = comportamiento esperado para no encontrado.
        assertFalse(result.isPresent());
    }
}
