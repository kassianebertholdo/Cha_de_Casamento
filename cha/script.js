/* =====================================================
   SUPABASE
===================================================== */

const {
    createClient
} = window.supabase;


const db =
    createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


/* =====================================================
   PRESENTES
===================================================== */

let gifts = [];

let reservations = [];

let currentCategory = "Todos";

let selectedGiftId = null;


/* =====================================================
   CARREGAR PRESENTES
===================================================== */

async function loadGifts() {

    const {
        data,
        error
    } = await db

        .from("gifts")

    .select("*")

    .order("id");


    if (error) {

        console.error(error);

        showToast(
            "Não foi possível carregar a lista."
        );

        return;

    }


    gifts = data || [];


    await loadReservationStatus();

}


/* =====================================================
   STATUS PÚBLICO
===================================================== */

async function loadReservationStatus() {

    /*
     * IMPORTANTE:
     *
     * O convidado NÃO pode consultar
     * guest_name.
     *
     * Então fazemos somente uma
     * contagem pública através de
     * uma função específica.
     */

    const {
        data,
        error
    } = await db.rpc(
        "get_public_reservation_status"
    );


    if (error) {

        console.error(error);

        /*
         * Enquanto a função não existir,
         * todos aparecem disponíveis.
         */

        reservations = [];

    } else {

        reservations = data || [];

    }


    renderGifts();

}


/* =====================================================
   RENDER
===================================================== */

function renderGifts() {

    const grid =
        document.getElementById(
            "giftsGrid"
        );


    grid.innerHTML = "";


    const filtered =
        currentCategory === "Todos"

    ?
    gifts

        : gifts.filter(
        gift =>
        gift.category ===
        currentCategory
    );


    filtered.forEach(gift => {

                const reserved =
                    reservations.some(
                        reservation =>
                        Number(
                            reservation.gift_id
                        ) ===
                        Number(gift.id)
                    );


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "gift-card";


                if (reserved) {

                    card.classList.add(
                        "reserved"
                    );

                }


                card.innerHTML = `

            <div>

                <div class="gift-icon">
                    ${gift.icon || "🎁"}
                </div>

                <div class="gift-category">
                    ${escapeHtml(
                        gift.category
                    )}
                </div>

                <h3>
                    ${escapeHtml(
                        gift.name
                    )}
                </h3>

            </div>


            <div>

                ${
                    reserved

                    ? `

                        <div class="gift-status">
                            ♡ RESERVADO
                        </div>

                        <div class="masked-name">
                            XXXXXXXX
                        </div>

                    `

                    : `

                        <div class="gift-status">
                            DISPONÍVEL
                        </div>

                        <button
                            class="gift-button"
                            data-id="${gift.id}"
                        >
                            Escolher este presente
                        </button>

                    `
                }

            </div>

        `;


        grid.appendChild(card);

    });


    document
        .querySelectorAll(
            ".gift-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openGiftModal(
                        Number(
                            button.dataset.id
                        )
                    );

                }
            );

        });

}


/* =====================================================
   FILTROS
===================================================== */

function renderCategories() {

    const filters =
        document.getElementById(
            "categoryFilters"
        );


    const categories = [

        "Todos",

        ...new Set(
            gifts.map(
                gift =>
                    gift.category
            )
        )

    ];


    filters.innerHTML = "";


    categories.forEach(category => {

        const button =
            document.createElement(
                "button"
            );


        button.className =
            "category-button";


        if (
            category ===
            currentCategory
        ) {

            button.classList.add(
                "active"
            );

        }


        button.textContent =
            category;


        button.addEventListener(
            "click",
            () => {

                currentCategory =
                    category;


                document
                    .querySelectorAll(
                        ".category-button"
                    )
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                renderGifts();

            }
        );


        filters.appendChild(
            button
        );

    });

}


/* =====================================================
   MODAL
===================================================== */

function openGiftModal(id) {

    const gift =
        gifts.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!gift) return;


    selectedGiftId =
        Number(id);


    document.getElementById(
        "selectedGift"
    ).textContent =
        gift.name;


    document.getElementById(
        "guestName"
    ).value = "";


    document.getElementById(
        "giftModal"
    ).classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            document
                .getElementById(
                    "guestName"
                )
                .focus();

        },
        100
    );

}


function closeGiftModal() {

    document.getElementById(
        "giftModal"
    ).classList.add(
        "hidden"
    );


    selectedGiftId =
        null;

}


/* =====================================================
   CONFIRMAR RESERVA
===================================================== */

async function confirmReservation() {

    const input =
        document.getElementById(
            "guestName"
        );


    const name =
        input.value.trim();


    if (!name) {

        showToast(
            "Digite seu nome 💚"
        );

        input.focus();

        return;

    }


    const button =
        document.getElementById(
            "confirmGift"
        );


    button.disabled =
        true;


    button.textContent =
        "Reservando...";


    const {
        data,
        error
    } = await db.rpc(
        "reserve_gift",
        {
            p_gift_id:
                selectedGiftId,

            p_guest_name:
                name
        }
    );


    button.disabled =
        false;


    button.textContent =
        "Confirmar meu presente ♡";


    if (error) {

        console.error(error);


        showToast(
            error.message.includes(
                "já foi"
            )

                ? "Esse presente já foi escolhido 💚"

                : "Não foi possível reservar."
        );


        await loadReservationStatus();

        closeGiftModal();

        return;

    }


    closeGiftModal();


    showToast(
        "Presente reservado com carinho! 💚"
    );


    await loadReservationStatus();

}


/* =====================================================
   ESCAPAR HTML
===================================================== */

function escapeHtml(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =====================================================
   TOAST
===================================================== */

let toastTimer;


function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* =====================================================
   EVENTOS DO MODAL
===================================================== */

document
    .getElementById(
        "closeModal"
    )
    .addEventListener(
        "click",
        closeGiftModal
    );


document
    .getElementById(
        "confirmGift"
    )
    .addEventListener(
        "click",
        confirmReservation
    );


document
    .getElementById(
        "giftModal"
    )
    .addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "giftModal"
            ) {

                closeGiftModal();

            }

        }
    );


 document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeGiftModal();

        }

    }
 );



       /* =====================================================
   ENTRAR NO NOSSO LAR
   ===================================================== */

      document
    .getElementById("enterButton")
    .addEventListener("click", () => {

        document
            .getElementById("intro")
            .classList.add("hide");

        document
            .getElementById("mainContent")
            .classList.remove("hidden");

    });


    /* =====================================================
   INICIALIZAÇÃO
    ===================================================== */

  async function init() {

    renderCategories();

    await loadGifts();

    renderCategories();

}


init();


/* =====================================================
   CARROSSEL DE FOTOS
===================================================== */

const carouselTrack =
    document.getElementById("carouselTrack");

const prevButton =
    document.getElementById("prevButton");

const nextButton =
    document.getElementById("nextButton");

const carouselDots =
    document.getElementById("carouselDots");

const slides =
    document.querySelectorAll(".carousel-slide");

let currentSlide = 0;


/* CRIAR OS PONTINHOS */

slides.forEach((slide, index) => {

    const dot =
        document.createElement("button");

    dot.className = "carousel-dot";

    if (index === 0) {
        dot.classList.add("active");
    }

    dot.addEventListener(
        "click",
        () => {
            goToSlide(index);
        }
    );

    carouselDots.appendChild(dot);

});


/* IR PARA UMA FOTO */

function goToSlide(index) {

    if (!slides.length) {
        return;
    }

    currentSlide =
        (index + slides.length) %
        slides.length;

    carouselTrack.style.transform =
        `translateX(-${currentSlide * 100}%)`;


    document
        .querySelectorAll(".carousel-dot")
        .forEach((dot, dotIndex) => {

            dot.classList.toggle(
                "active",
                dotIndex === currentSlide
            );

        });

}


/* FOTO ANTERIOR */

prevButton.addEventListener(
    "click",
    () => {
        goToSlide(currentSlide - 1);
    }
);


/* PRÓXIMA FOTO */

nextButton.addEventListener(
    "click",
    () => {
        goToSlide(currentSlide + 1);
    }
);


  /* =====================================================
   PASSAGEM AUTOMÁTICA
   ===================================================== */

  setInterval(() => {

    goToSlide(currentSlide + 1);

}, 5000);