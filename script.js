// =====================================
// IMPORTACIONES FIREBASE (Versión estable)
// =====================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =====================================
// CONFIGURACIÓN DE FIREBASE
// =====================================
const firebaseConfig = {
    apiKey: "AIzaSyCXZj0kqILXKCZPInqLRtwhJ_KWv-TI7JY",
    authDomain: "ergomuebles-815ba.firebaseapp.com",
    projectId: "ergomuebles-815ba",
    storageBucket: "ergomuebles-815ba.firebasestorage.app",
    messagingSenderId: "827607635309",
    appId: "1:827607635309:web:6f53d47d7ae59256887664",
    measurementId: "G-91W41YL3SP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =====================================
// RESTO DEL CÓDIGO
// =====================================

    // =====================================
    // VARIABLES DEL CARRITO
    // =====================================
    let carrito = [];
    let costoEnvio = 0;
    let envioCalculado = false;

    const botonesAgregar = document.querySelectorAll(".btn-agregar");
    const btnAbrirCarrito = document.getElementById("btn-abrir-carrito");
    const modalCarrito = document.getElementById("modal-carrito");
    const btnCerrarCarrito = document.getElementById("cerrar-carrito");
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const cartSubtotal = document.getElementById("cart-subtotal");
    const cartEnvio = document.getElementById("cart-envio");
    const cartCounter = document.getElementById("cart-counter");
    const btnCheckout = document.getElementById("btn-checkout");

    const btnCalcularEnvio = document.getElementById("btn-calcular-envio");
    const envioResultado = document.getElementById("envio-resultado");
    const envioCP = document.getElementById("envio-cp");
    const envioZona = document.getElementById("envio-zona");

    const TARIFAS_ENVIO = { local: 50, regional: 120, nacional: 200 };
    const MINIMO_ENVIO_GRATIS = 300;

    // =====================================
    // AGREGAR PRODUCTOS AL CARRITO
    // =====================================
    botonesAgregar.forEach(boton => {
        boton.addEventListener("click", () => {
            const nombre = boton.dataset.nombre;
            const precio = parseFloat(boton.dataset.precio);
            if (!nombre || isNaN(precio)) {
                alert("No se pudieron obtener los datos del producto.");
                return;
            }
            carrito.push({ nombre, precio });
            actualizarCarrito();

            if (cartCounter) {
                cartCounter.style.transform = "scale(1.3)";
                setTimeout(() => { cartCounter.style.transform = "scale(1)"; }, 200);
            }

            boton.textContent = "¡Agregado!";
            setTimeout(() => { boton.textContent = "Agregar al Carrito"; }, 900);
        });
    });

    // =====================================
    // ACTUALIZAR CARRITO
    // =====================================
    function actualizarCarrito() {
        if (!cartItems || !cartTotal || !cartCounter) return;

        cartItems.innerHTML = "";
        let subtotal = 0;

        if (carrito.length === 0) {
            cartItems.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío.</p>';
            costoEnvio = 0;
            envioCalculado = false;
            if (envioResultado) envioResultado.textContent = "";
            if (cartEnvio) cartEnvio.textContent = "—";
        }

        carrito.forEach((producto, indice) => {
            subtotal += producto.precio;

            const item = document.createElement("div");
            item.classList.add("item-carrito");

            const informacion = document.createElement("div");
            const nombre = document.createElement("strong");
            nombre.textContent = producto.nombre;
            const precio = document.createElement("p");
            precio.textContent = "$" + producto.precio.toFixed(2);
            informacion.appendChild(nombre);
            informacion.appendChild(precio);

            const btnEliminar = document.createElement("button");
            btnEliminar.textContent = "Eliminar";
            btnEliminar.type = "button";
            btnEliminar.addEventListener("click", () => {
                carrito.splice(indice, 1);
                actualizarCarrito();
            });

            item.appendChild(informacion);
            item.appendChild(btnEliminar);
            cartItems.appendChild(item);
        });

        if (subtotal >= MINIMO_ENVIO_GRATIS && subtotal > 0) {
            costoEnvio = 0;
            if (cartEnvio) cartEnvio.textContent = "GRATIS 🎉";
        } else if (envioCalculado) {
            if (cartEnvio) cartEnvio.textContent = "$" + costoEnvio.toFixed(2);
        } else {
            if (cartEnvio) cartEnvio.textContent = "—";
        }

        const total = subtotal + (envioCalculado ? costoEnvio : 0);
        if (cartSubtotal) cartSubtotal.textContent = subtotal.toFixed(2);
        cartTotal.textContent = total.toFixed(2);
        cartCounter.textContent = carrito.length;
    }

    // =====================================
    // CALCULADORA DE ENVÍO
    // =====================================
    if (btnCalcularEnvio) {
        btnCalcularEnvio.addEventListener("click", () => {
            const cp = envioCP.value.trim();
            const zona = envioZona.value;
            envioResultado.classList.remove("error");

            if (carrito.length === 0) {
                envioResultado.textContent = "Agrega productos antes de calcular el envío.";
                envioResultado.classList.add("error");
                return;
            }
            if (!/^\d{5}$/.test(cp)) {
                envioResultado.textContent = "Ingresa un código postal válido (5 dígitos).";
                envioResultado.classList.add("error");
                return;
            }
            if (!zona) {
                envioResultado.textContent = "Selecciona una zona de entrega.";
                envioResultado.classList.add("error");
                return;
            }

            const subtotalActual = carrito.reduce((acc, p) => acc + p.precio, 0);
            if (subtotalActual >= MINIMO_ENVIO_GRATIS) {
                costoEnvio = 0;
                envioResultado.textContent = "¡Felicidades! Tu envío es GRATIS por superar $" + MINIMO_ENVIO_GRATIS + ".";
            } else {
                costoEnvio = TARIFAS_ENVIO[zona];
                envioResultado.textContent = "Costo de envío a CP " + cp + ": $" + costoEnvio.toFixed(2);
            }
            envioCalculado = true;
            actualizarCarrito();
        });
    }

    // =====================================
    // ABRIR / CERRAR CARRITO
    // =====================================
    if (btnAbrirCarrito && modalCarrito) {
        btnAbrirCarrito.addEventListener("click", () => modalCarrito.classList.add("active"));
    }
    if (btnCerrarCarrito && modalCarrito) {
        btnCerrarCarrito.addEventListener("click", () => modalCarrito.classList.remove("active"));
    }
    if (modalCarrito) {
        modalCarrito.addEventListener("click", e => {
            if (e.target === modalCarrito) modalCarrito.classList.remove("active");
        });
    }

    // =====================================
    // CONTINUAR COMPRA
    // =====================================
    const modalPago = document.getElementById("modal-pago");
    const btnCerrarPago = document.getElementById("cerrar-pago");
    const formPago = document.getElementById("form-pago");

    if (btnCheckout) {
        btnCheckout.addEventListener("click", () => {
            if (carrito.length === 0) { alert("Tu carrito está vacío."); return; }
            if (!envioCalculado) { alert("Por favor calcula el costo de envío antes de continuar."); return; }
            modalCarrito.classList.remove("active");
            if (modalPago) modalPago.classList.add("active");
        });
    }
    if (btnCerrarPago && modalPago) {
        btnCerrarPago.addEventListener("click", () => modalPago.classList.remove("active"));
    }
    if (formPago) {
        formPago.addEventListener("submit", e => {
            e.preventDefault();
            alert("¡Pedido registrado! Gracias por comprar en ErgoMuebles.");
            carrito = []; costoEnvio = 0; envioCalculado = false;
            actualizarCarrito();
            modalPago.classList.remove("active");
            formPago.reset();
        });
    }

    // =====================================
    // LOGIN / REGISTRO (CON PESTAÑAS)
    // =====================================
    const modalAuth = document.getElementById("modal-auth");
    const btnAbrirLogin = document.getElementById("btn-abrir-login");
    const btnCerrarAuth = document.getElementById("cerrar-auth");
    
    const tabLogin = document.getElementById("tab-login");
    const tabRegistro = document.getElementById("tab-registro");
    const contenedorLogin = document.getElementById("contenedor-login");
    const contenedorRegistro = document.getElementById("contenedor-registro");

    const formLogin = document.getElementById("form-login");
    const formRegistro = document.getElementById("form-registro");
    const userProfile = document.getElementById("user-profile");
    const userNameDisplay = document.getElementById("user-name-display");

    // Abrir modal
    if (btnAbrirLogin && modalAuth) {
        btnAbrirLogin.addEventListener("click", () => modalAuth.classList.add("active"));
    }
    // Cerrar modal
    if (btnCerrarAuth && modalAuth) {
        btnCerrarAuth.addEventListener("click", () => modalAuth.classList.remove("active"));
        modalAuth.addEventListener("click", e => {
            if (e.target === modalAuth) modalAuth.classList.remove("active");
        });
    }

    // Cambiar entre Tabs
    if (tabLogin && tabRegistro) {
        tabLogin.addEventListener("click", () => {
            tabLogin.classList.add("active");
            tabRegistro.classList.remove("active");
            contenedorLogin.style.display = "block";
            contenedorRegistro.style.display = "none";
        });
        tabRegistro.addEventListener("click", () => {
            tabRegistro.classList.add("active");
            tabLogin.classList.remove("active");
            contenedorLogin.style.display = "none";
            contenedorRegistro.style.display = "block";
        });
    }

    // Submit Login
    if (formLogin) {
        formLogin.addEventListener("submit", e => {
            e.preventDefault();
            const email = document.getElementById("login-email").value;
            let nombre = email.split("@")[0];
            nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
            if (userNameDisplay) userNameDisplay.textContent = nombre.length > 10 ? nombre.substring(0, 10) + "..." : nombre;
            
            modalAuth.classList.remove("active");
            if (btnAbrirLogin) btnAbrirLogin.style.display = "none";
            if (userProfile) userProfile.style.display = "block";
            
            formLogin.reset();
            alert("¡Bienvenido a ErgoMuebles!");
        });
    }

    // Submit Registro
    if (formRegistro) {
        formRegistro.addEventListener("submit", e => {
            e.preventDefault();
            const nombre = document.getElementById("registro-nombre").value;
            if (userNameDisplay) userNameDisplay.textContent = nombre.length > 10 ? nombre.substring(0, 10) + "..." : nombre;
            
            modalAuth.classList.remove("active");
            if (btnAbrirLogin) btnAbrirLogin.style.display = "none";
            if (userProfile) userProfile.style.display = "block";
            
            formRegistro.reset();
            alert("¡Tu cuenta se ha creado correctamente!");
        });
    }

    // Menú de usuario (Cerrar sesión)
    const btnUserMenu = document.getElementById("btn-user-menu");
    const dropdownMenu = document.getElementById("dropdown-menu");
    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");

    if (btnUserMenu && dropdownMenu) {
        btnUserMenu.addEventListener("click", () => dropdownMenu.classList.toggle("active"));
    }
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", e => {
            e.preventDefault();
            if (userProfile) userProfile.style.display = "none";
            if (btnAbrirLogin) btnAbrirLogin.style.display = "block";
            if (userNameDisplay) userNameDisplay.textContent = "Usuario";
            if (dropdownMenu) dropdownMenu.classList.remove("active");
            alert("Has cerrado sesión correctamente.");
        });
    }

    // =====================================
    // FILTRO DE CATEGORÍAS
    // =====================================
    const productos = document.querySelectorAll(".producto-card");

    function filtrarProductos(categoria) {
        productos.forEach(producto => {
            producto.style.display = (categoria === "todos" || producto.dataset.categoria === categoria) ? "flex" : "none";
        });
        document.querySelector(".productos-section")?.scrollIntoView({ behavior: "smooth" });
    }

    const categorias = {
        "menu-inicio": "todos", "menu-sillas": "sillas", "menu-escritorios": "escritorios",
        "menu-accesorios": "accesorios", "menu-ofertas": "ofertas",
        "footer-inicio": "todos", "footer-sillas": "sillas", "footer-escritorios": "escritorios",
        "footer-accesorios": "accesorios", "footer-ofertas": "ofertas"
    };

    Object.entries(categorias).forEach(([id, categoria]) => {
        const enlace = document.getElementById(id);
        if (enlace) {
            enlace.addEventListener("click", e => {
                e.preventDefault();
                filtrarProductos(categoria);
            });
        }
    });

    // =====================================
    // BÚSQUEDA
    // =====================================
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");
    const clearSearch = document.getElementById("clear-search");

    function buscarProductos() {
        if (!searchInput) return;
        const texto = searchInput.value.toLowerCase().trim();
        productos.forEach(producto => {
            const nombre = producto.querySelector("h3").textContent.toLowerCase();
            producto.style.display = nombre.includes(texto) ? "flex" : "none";
        });
        document.querySelector(".productos-section")?.scrollIntoView({ behavior: "smooth" });
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            if (clearSearch) clearSearch.style.display = searchInput.value.trim() ? "block" : "none";
            buscarProductos();
        });
        searchInput.addEventListener("keydown", e => {
            if (e.key === "Enter") { e.preventDefault(); buscarProductos(); }
        });
    }
    if (searchBtn) searchBtn.addEventListener("click", buscarProductos);
    if (clearSearch) {
        clearSearch.addEventListener("click", () => {
            searchInput.value = "";
            clearSearch.style.display = "none";
            productos.forEach(p => p.style.display = "flex");
            searchInput.focus();
        });
    }

    // =====================================
    // PREGUNTAS FRECUENTES
    // =====================================
    document.querySelectorAll(".faq-question").forEach(pregunta => {
        pregunta.addEventListener("click", () => {
            const respuesta = pregunta.nextElementSibling;
            const icono = pregunta.querySelector("span");
            if (respuesta.style.maxHeight) {
                respuesta.style.maxHeight = null;
                if (icono) icono.textContent = "+";
            } else {
                document.querySelectorAll(".faq-answer").forEach(item => item.style.maxHeight = null);
                document.querySelectorAll(".faq-question span").forEach(item => item.textContent = "+");
                respuesta.style.maxHeight = respuesta.scrollHeight + "px";
                if (icono) icono.textContent = "-";
            }
        });
    });

    // =====================================
    // CALIFICACIÓN CON ESTRELLAS (sección antigua)
    // =====================================
    const estrellas = document.querySelectorAll(".star");
    const ratingMessage = document.getElementById("rating-message");
    estrellas.forEach(estrella => {
        estrella.addEventListener("click", () => {
            const valor = parseInt(estrella.dataset.value);
            estrellas.forEach(item => {
                item.classList.toggle("selected", parseInt(item.dataset.value) <= valor);
            });
            if (ratingMessage) ratingMessage.textContent = `¡Gracias por tu calificación de ${valor} estrellas!`;
        });
    });

    // =====================================
    // BOTÓN DE CHAT
    // =====================================
    const chatFloat = document.getElementById("chat-float");
    if (chatFloat) {
        chatFloat.addEventListener("click", e => {
            e.preventDefault();
            alert("¡Gracias por contactar a ErgoMuebles! Próximamente estará disponible nuestro chat.");
        });
    }

    // =====================================
    // MODAL LEGAL
    // =====================================
    const modalLegal = document.getElementById("modal-legal");
    const btnCerrarLegal = document.getElementById("cerrar-legal");
    const legalTitulo = document.getElementById("legal-titulo");
    const legalContenido = document.getElementById("legal-contenido");

    const TEXTOS_LEGALES = {
        privacidad: {
            titulo: "Política de Privacidad",
            html: `
                <p>En <strong>ErgoMuebles</strong> respetamos tu privacidad. Esta política describe cómo recopilamos, usamos y protegemos tus datos personales.</p>
                <h3>1. Datos que recopilamos</h3>
                <ul>
                    <li>Nombre y datos de contacto (correo, teléfono).</li>
                    <li>Dirección de entrega y código postal.</li>
                    <li>Historial de compras y preferencias.</li>
                </ul>
                <h3>2. Uso de la información</h3>
                <p>Utilizamos tus datos para procesar pedidos, enviar actualizaciones y mejorar nuestros servicios. No compartimos tu información con terceros sin tu consentimiento, salvo por obligación legal.</p>
                <h3>3. Derechos ARCO</h3>
                <p>Puedes ejercer tus derechos de Acceso, Rectificación, Cancelación y Oposición escribiendo a <em>privacidad@ergomuebles.com</em>.</p>
                <h3>4. Seguridad</h3>
                <p>Implementamos medidas técnicas y administrativas para proteger tu información personal.</p>
            `
        },
        terminos: {
            titulo: "Términos y Condiciones",
            html: `
                <p>Al utilizar este sitio aceptas los siguientes términos:</p>
                <h3>1. Uso del sitio</h3>
                <p>El contenido de ErgoMuebles es solo para uso personal y no comercial. Queda prohibida su reproducción sin autorización.</p>
                <h3>2. Precios y disponibilidad</h3>
                <p>Los precios están expresados en pesos mexicanos (MXN) e incluyen impuestos. Nos reservamos el derecho de modificar precios y disponibilidad sin previo aviso.</p>
                <h3>3. Pedidos</h3>
                <p>Todo pedido está sujeto a confirmación y disponibilidad de stock.</p>
                <h3>4. Responsabilidad</h3>
                <p>ErgoMuebles no se hace responsable por el uso indebido de los productos adquiridos.</p>
            `
        },
        cookies: {
            titulo: "Política de Cookies",
            html: `
                <p>Utilizamos cookies para mejorar tu experiencia de navegación.</p>
                <h3>¿Qué son las cookies?</h3>
                <p>Son pequeños archivos que se almacenan en tu dispositivo para recordar preferencias y analizar el tráfico del sitio.</p>
                <h3>Tipos de cookies que usamos</h3>
                <ul>
                    <li><strong>Esenciales:</strong> necesarias para el funcionamiento del carrito y la sesión.</li>
                    <li><strong>Analíticas:</strong> nos ayudan a entender cómo usas el sitio.</li>
                </ul>
                <p>Puedes desactivar las cookies desde la configuración de tu navegador.</p>
            `
        },
        devoluciones: {
            titulo: "Devoluciones y Reembolsos",
            html: `
                <p>Tu satisfacción es nuestra prioridad.</p>
                <h3>Plazo de devolución</h3>
                <p>Aceptamos devoluciones dentro de los <strong>30 días naturales</strong> posteriores a la entrega, siempre que el producto esté en su empaque original y sin uso.</p>
                <h3>Proceso</h3>
                <ul>
                    <li>Escríbenos a <em>soporte@ergomuebles.com</em> con tu número de pedido.</li>
                    <li>Te enviaremos una guía de retorno.</li>
                    <li>Una vez recibido el producto, procesamos el reembolso en un plazo de 5 a 10 días hábiles.</li>
                </ul>
                <h3>Excepciones</h3>
                <p>Productos personalizados o en oferta final no aplican para devolución.</p>
            `
        },
        aviso: {
            titulo: "Aviso Legal",
            html: `
                <p>El sitio <strong>ErgoMuebles</strong> es operado por ErgoMuebles TCG, con domicilio en México.</p>
                <h3>Propiedad intelectual</h3>
                <p>Todas las marcas, logotipos y contenidos son propiedad de ErgoMuebles o de sus respectivos titulares.</p>
                <h3>Enlaces externos</h3>
                <p>No nos hacemos responsables del contenido de sitios de terceros enlazados desde esta página.</p>
                <h3>Legislación aplicable</h3>
                <p>Este aviso se rige por las leyes de los Estados Unidos Mexicanos.</p>
            `
        }
    };

    document.querySelectorAll(".legal-link").forEach(enlace => {
        enlace.addEventListener("click", e => {
            e.preventDefault();
            const data = TEXTOS_LEGALES[enlace.dataset.legal];
            if (!data || !modalLegal) return;
            legalTitulo.textContent = data.titulo;
            legalContenido.innerHTML = data.html;
            modalLegal.classList.add("active");
        });
    });

    if (btnCerrarLegal && modalLegal) {
        btnCerrarLegal.addEventListener("click", () => modalLegal.classList.remove("active"));
        modalLegal.addEventListener("click", e => {
            if (e.target === modalLegal) modalLegal.classList.remove("active");
        });
    }

    // =====================================
    // SISTEMA DE RESEÑAS CON FIRESTORE
    // =====================================
    const modalResenas = document.getElementById("modal-resenas");
    const btnCerrarResenas = document.getElementById("cerrar-resenas");
    const resenasProductoNombre = document.getElementById("resenas-producto-nombre");
    const resenasPromedioNum = document.getElementById("resenas-promedio-num");
    const resenasPromedioEstrellas = document.getElementById("resenas-promedio-estrellas");
    const resenasTotal = document.getElementById("resenas-total");
    const listaResenas = document.getElementById("lista-resenas");
    const formResena = document.getElementById("form-resena");
    const resenaNombre = document.getElementById("resena-nombre");
    const resenaComentario = document.getElementById("resena-comentario");
    const resenaEstrellasInput = document.getElementById("resena-estrellas");
    
    let productoResenaActual = null;
    let cacheResenas = null;

    async function cargarTodasLasResenas() {
        try {
            const q = query(collection(db, "resenas"), orderBy("fecha", "desc"));
            const snapshot = await getDocs(q);
            cacheResenas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error cargando reseñas:", error);
            cacheResenas = [];
        }
        return cacheResenas;
    }

    async function obtenerResenas(producto) {
        if (cacheResenas === null) await cargarTodasLasResenas();
        return cacheResenas.filter(r => r.producto === producto);
    }

    async function guardarResenaFirebase(resena) {
        try {
            await addDoc(collection(db, "resenas"), {
                ...resena,
                fecha: serverTimestamp()
            });
            cacheResenas = null;
            return true;
        } catch (error) {
            console.error("Error guardando reseña:", error);
            alert("ERROR DE FIREBASE: " + error.message + "\n\nRevisa que tengas las reglas de Firestore en 'Modo de Prueba'.");
            return false;
        }
    }

    function estrellasTexto(valor) {
        const llenas = Math.round(valor);
        return "★".repeat(llenas) + "☆".repeat(5 - llenas);
    }

    async function actualizarMiniResenas() {
        await cargarTodasLasResenas();

        document.querySelectorAll(".producto-card").forEach(card => {
            const nombre = card.querySelector("h3")?.textContent?.trim();
            if (!nombre) return;

            let mini = card.querySelector(".resenas-mini");
            if (!mini) {
                mini = document.createElement("div");
                mini.className = "resenas-mini";
                const precio = card.querySelector(".precio");
                if (precio) precio.after(mini);
                else card.appendChild(mini);
            }

            const resenas = cacheResenas.filter(r => r.producto === nombre);
            if (resenas.length > 0) {
                const suma = resenas.reduce((acc, r) => acc + r.estrellas, 0);
                const promedio = suma / resenas.length;
                mini.innerHTML = `<span class="estrellas-mini">${estrellasTexto(promedio)}</span> ${promedio.toFixed(1)} (${resenas.length})`;
            } else {
                mini.innerHTML = `<span class="sin-resenas">Sin reseñas</span>`;
            }
        });
    }

    async function abrirResenasProducto(nombreProducto) {
        productoResenaActual = nombreProducto;
        resenasProductoNombre.textContent = nombreProducto;

        const resenas = await obtenerResenas(nombreProducto);

        if (resenas.length > 0) {
            const suma = resenas.reduce((acc, r) => acc + r.estrellas, 0);
            const promedio = suma / resenas.length;
            resenasPromedioNum.textContent = promedio.toFixed(1);
            resenasPromedioEstrellas.textContent = estrellasTexto(promedio);
        } else {
            resenasPromedioNum.textContent = "0.0";
            resenasPromedioEstrellas.textContent = "☆☆☆☆☆";
        }

        resenasTotal.textContent = resenas.length + (resenas.length === 1 ? " reseña" : " reseñas");

        listaResenas.innerHTML = "";

        if (resenas.length === 0) {
            listaResenas.innerHTML = '<p class="resenas-vacio">Aún no hay reseñas. ¡Sé el primero en opinar!</p>';
        } else {
            resenas.forEach(r => {
                const item = document.createElement("div");
                item.classList.add("resena-item");

                const header = document.createElement("div");
                header.classList.add("resena-header");

                const autor = document.createElement("span");
                autor.classList.add("resena-autor");
                autor.textContent = r.nombre;

                const stars = document.createElement("span");
                stars.classList.add("resena-estrellas");
                stars.textContent = estrellasTexto(r.estrellas);

                header.appendChild(autor);
                header.appendChild(stars);

                const fecha = document.createElement("p");
                fecha.classList.add("resena-fecha");
                if (r.fecha && r.fecha.toDate) {
                    fecha.textContent = r.fecha.toDate().toLocaleDateString("es-MX", {
                        day: "2-digit", month: "short", year: "numeric"
                    });
                } else {
                    fecha.textContent = "Reciente";
                }

                const texto = document.createElement("p");
                texto.classList.add("resena-texto");
                texto.textContent = r.comentario;

                item.appendChild(header);
                item.appendChild(fecha);
                item.appendChild(texto);
                listaResenas.appendChild(item);
            });
        }

        formResena.reset();
        resenaEstrellasInput.value = "0";
        
        document.querySelectorAll(".estrella-btn").forEach(b => b.classList.remove("activa"));

        modalResenas.classList.add("active");
    }

    document.querySelectorAll(".producto-card").forEach(card => {
        let btn = card.querySelector(".btn-ver-resenas");
        if (!btn) {
            const nombre = card.querySelector("h3")?.textContent?.trim();
            if (!nombre) return;
            btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn-ver-resenas";
            btn.dataset.producto = nombre;
            btn.textContent = "⭐ Ver reseñas";
            card.appendChild(btn);
        }
        btn.addEventListener("click", () => abrirResenasProducto(btn.dataset.producto));
    });

    if (btnCerrarResenas && modalResenas) {
        btnCerrarResenas.addEventListener("click", () => {
            modalResenas.classList.remove("active");
        });
        modalResenas.addEventListener("click", e => {
            if (e.target === modalResenas) modalResenas.classList.remove("active");
        });
    }

    const contenedorEstrellas = document.getElementById("estrellas-input");
    if (contenedorEstrellas) {
        contenedorEstrellas.addEventListener("click", (e) => {
            const btn = e.target.closest(".estrella-btn");
            if (!btn) return;
            
            console.log("Estrella clickeada, valor:", btn.dataset.valor); 

            const valor = parseInt(btn.dataset.valor);
            resenaEstrellasInput.value = valor;
            
            const todasLasEstrellas = contenedorEstrellas.querySelectorAll(".estrella-btn");
            todasLasEstrellas.forEach(b => {
                b.classList.toggle("activa", parseInt(b.dataset.valor) <= valor);
            });
        });
    } else {
        console.error("No se encontró el contenedor de estrellas");
    }

    if (formResena) {
        formResena.addEventListener("submit", async e => {
            e.preventDefault();
            console.log("¡Formulario interceptado!"); 

            if (!productoResenaActual) {
                console.log("Error: No hay producto seleccionado");
                return;
            }

            const nombre = resenaNombre.value.trim();
            const comentario = resenaComentario.value.trim();
            const estrellas = parseInt(resenaEstrellasInput.value);

            console.log("Datos a guardar:", { nombre, comentario, estrellas }); 

            if (!nombre || !comentario) {
                alert("Completa tu nombre y comentario.");
                return;
            }
            if (estrellas < 1 || estrellas > 5) {
                alert("Selecciona una calificación de 1 a 5 estrellas.");
                return;
            }

            console.log("Guardando en Firebase..."); 
            const exito = await guardarResenaFirebase({
                producto: productoResenaActual,
                nombre,
                comentario,
                estrellas
            });
            console.log("Resultado de Firebase:", exito); 

            if (exito) {
                await actualizarMiniResenas();
                await abrirResenasProducto(productoResenaActual);
            }
        });
    }

    actualizarMiniResenas();
    actualizarCarrito();