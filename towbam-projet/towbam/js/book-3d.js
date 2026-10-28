/**
 * TOWBAM — Module d'Animation 3D des Livres & Splash Screen
 * Gestion de l'affichage du livre physique de la hero section,
 * du feuilletage séquentiel naturel et du splash screen d'introduction.
 */

(function () {
  'use strict';

  /**
   * Retourne le HTML complet du livre 3D physique pour la Hero Section
   */
  function getHeroBookHTML() {
    return `
      <div class="book-stage" aria-label="Livre physique 3D TOWBAM ouvert avec feuilletage des pages">
        <div class="book-ambient-glow" aria-hidden="true"></div>
        <div class="book-ambient-ring" aria-hidden="true"></div>
        <div class="book-3d-scene" aria-hidden="true">
          <div class="book-3d-rig">
            <!-- Ombres portées réalistes -->
            <div class="book-ground-shadow"></div>
            <div class="book-crease-shadow"></div>

            <!-- Corps physique du livre 3D -->
            <div class="book-physical">
              <!-- Plat arrière (couverture rigide verso) -->
              <div class="book-back-cover"></div>

              <!-- Tranchefile et reliure centrale 3D -->
              <div class="book-spine-pillar">
                <span class="spine-headband top"></span>
                <span class="spine-rib rib-1"></span>
                <span class="spine-rib rib-2"></span>
                <span class="spine-rib rib-3"></span>
                <span class="spine-headband bottom"></span>
              </div>

              <!-- Page de gauche fixe (lit de pages déjà tournées - Page 42) -->
              <div class="book-left-bed">
                <div class="bed-surface-left">
                  <div class="page-texture"></div>
                  <div class="page-content">
                    <div class="page-header">
                      <span class="page-tag">TOWBAM Éditions</span>
                      <span class="page-folio">42</span>
                    </div>
                    <div class="page-body">
                      <h4 class="page-chapter">Chapitre Premier</h4>
                      <p class="page-quote">« Chaque récit est une flamme qui traverse le temps et relie les rives de notre mémoire. »</p>
                      <div class="page-lines">
                        <span class="pline pline-full"></span>
                        <span class="pline pline-full"></span>
                        <span class="pline pline-mid"></span>
                        <span class="pline pline-full"></span>
                        <span class="pline pline-short"></span>
                      </div>
                    </div>
                    <div class="page-ornament">✦</div>
                  </div>
                  <div class="gutter-shadow-left"></div>
                </div>
              </div>

              <!-- Bloc de droite fixe (page de fond sous la pile - Page 50) -->
              <div class="book-right-block">
                <div class="tranche-right"></div>
                <div class="tranche-top"></div>
                <div class="tranche-bottom"></div>
                <div class="bed-surface-right">
                  <div class="page-texture"></div>
                  <div class="page-content">
                    <div class="page-header">
                      <span class="page-folio">50</span>
                      <span class="page-tag">TOWBAM Éditions</span>
                    </div>
                    <div class="page-body">
                      <h5 class="page-sub">Épilogue</h5>
                      <div class="page-lines">
                        <span class="pline pline-full"></span>
                        <span class="pline pline-mid"></span>
                        <span class="pline pline-full"></span>
                        <span class="pline pline-short"></span>
                      </div>
                    </div>
                    <div class="page-ornament">✦</div>
                  </div>
                  <div class="gutter-shadow-right"></div>
                </div>
              </div>

              <!-- Feuilles individuelles tournantes (feuilletage lent et naturel) -->
              <div class="turning-leaves-container">
                <!-- Feuille 1 (Pages 43 & 44) -->
                <div class="leaf leaf-1">
                  <div class="leaf-curl-wrap">
                    <div class="leaf-face leaf-front">
                      <div class="page-texture"></div>
                      <div class="page-content">
                        <div class="page-header">
                          <span class="page-folio">43</span>
                          <span class="page-tag">Voix du Continent</span>
                        </div>
                        <div class="page-body">
                          <p class="page-lead">Sur les chemins de sable rouge, la parole des anciens n’est jamais perdue : elle se grave dans l’encre des livres nouveaux.</p>
                          <div class="page-lines">
                            <span class="pline pline-full"></span>
                            <span class="pline pline-mid"></span>
                            <span class="pline pline-full"></span>
                          </div>
                        </div>
                        <div class="page-ornament">✦</div>
                      </div>
                    </div>
                    <div class="leaf-face leaf-back">
                      <div class="page-texture"></div>
                      <div class="page-content">
                        <div class="page-header">
                          <span class="page-tag">TOWBAM Récits</span>
                          <span class="page-folio">44</span>
                        </div>
                        <div class="page-body">
                          <h5 class="page-sub">Les Échos du Fleuve</h5>
                          <p class="page-text-sm">« Écrire, c'est offrir aux lendemains une mémoire inaltérable. »</p>
                          <div class="page-lines">
                            <span class="pline pline-full"></span>
                            <span class="pline pline-mid"></span>
                          </div>
                        </div>
                        <div class="page-ornament">✦</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Feuille 2 (Pages 45 & 46) -->
                <div class="leaf leaf-2">
                  <div class="leaf-curl-wrap">
                    <div class="leaf-face leaf-front">
                      <div class="page-texture"></div>
                      <div class="page-content">
                        <div class="page-header">
                          <span class="page-folio">45</span>
                          <span class="page-tag">Horizons</span>
                        </div>
                        <div class="page-body">
                          <h5 class="page-sub">Le Chant des Étoiles</h5>
                          <p class="page-lead">Au-dessus des savanes et des fleuves, les mots tissent les liens d'une même communauté littéraire.</p>
                          <div class="page-lines">
                            <span class="pline pline-full"></span>
                            <span class="pline pline-mid"></span>
                          </div>
                        </div>
                        <div class="page-ornament">✦</div>
                      </div>
                    </div>
                    <div class="leaf-face leaf-back">
                      <div class="page-texture"></div>
                      <div class="page-content">
                        <div class="page-header">
                          <span class="page-tag">Mémoires Vives</span>
                          <span class="page-folio">46</span>
                        </div>
                        <div class="page-body">
                          <p class="page-lead">La sagesse se transmet de main en main, de page en page, guidée par la plume.</p>
                          <div class="page-lines">
                            <span class="pline pline-full"></span>
                            <span class="pline pline-short"></span>
                          </div>
                        </div>
                        <div class="page-ornament">✦</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Feuille 3 (Pages 47 & 48) -->
                <div class="leaf leaf-3">
                  <div class="leaf-curl-wrap">
                    <div class="leaf-face leaf-front">
                      <div class="page-texture"></div>
                      <div class="page-content">
                        <div class="page-header">
                          <span class="page-folio">47</span>
                          <span class="page-tag">Transmissions</span>
                        </div>
                        <div class="page-body">
                          <p class="page-quote">« Rien n'est plus grand qu'une histoire qui trouve son lecteur. »</p>
                          <div class="page-lines">
                            <span class="pline pline-full"></span>
                            <span class="pline pline-short"></span>
                          </div>
                        </div>
                        <div class="page-ornament">✦</div>
                      </div>
                    </div>
                    <div class="leaf-face leaf-back">
                      <div class="page-texture"></div>
                      <div class="page-content">
                        <div class="page-header">
                          <span class="page-tag">Nouveaux Horizons</span>
                          <span class="page-folio">48</span>
                        </div>
                        <div class="page-body">
                          <p class="page-lead">Et l’histoire continue, résonnant au cœur de chaque lecteur passionné.</p>
                        </div>
                        <div class="page-ornament">✦</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Couverture rigide avant (s'ouvre à l'arrivée) -->
              <div class="book-cover-hinge">
                <div class="book-front-cover">
                  <!-- Face extérieure en cuir carmin et dorure -->
                  <div class="cover-side cover-outside">
                    <div class="cover-finish"></div>
                    <div class="cover-frame">
                      <span class="cover-brand">TOWBAM</span>
                      <div class="cover-emboss-symbol">
                        <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true">
                          <circle cx="24" cy="24" r="21" fill="none" stroke="#f0c987" stroke-width="1.5" stroke-dasharray="3 2" />
                          <circle cx="24" cy="17" r="5.5" fill="#f0c987" />
                          <path d="M11 27l13 3.5v9.5L11 36.5zM37 27l-13 3.5v9.5l13-3.5z" fill="#fdfaf3" />
                          <path d="M24 30.5v9.5" stroke="#851e1f" stroke-width="1.2" />
                        </svg>
                      </div>
                      <h3 class="cover-main-title">Des histoires<br><em>qui méritent</em><br>d’être lues</h3>
                      <span class="cover-sub">Anthologie Littéraire</span>
                    </div>
                    <div class="cover-edge-thickness"></div>
                  </div>
                  <!-- Face intérieure (Garde marbrée ivoire & rembordage) -->
                  <div class="cover-side cover-inside">
                    <div class="endpaper-pattern"></div>
                    <div class="endpaper-content">
                      <span class="endpaper-seal">TOWBAM · ÉDITION ORIGINALE</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Initialise le splash screen avec l'animation de croisement 3D
   */
  function initSplashScreen(options = {}) {
    try {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      const hasShown = sessionStorage.getItem('towbam_splash_shown');
      if (hasShown === 'true' && !options.force) return;

      // Nettoyage de tout splash résiduel
      const existing = document.getElementById('splash-screen');
      if (existing) existing.remove();

      const splash = document.createElement('div');
      splash.id = 'splash-screen';
      splash.className = 'splash-screen';
      splash.setAttribute('role', 'dialog');
      splash.setAttribute('aria-label', 'Bienvenue sur TOWBAM');
      splash.innerHTML = `
        <div class="splash-backdrop" aria-hidden="true"></div>
        <div class="splash-scene" aria-hidden="true">
          <!-- Premier Livre 3D : Rouge Carmin / Premier Plan -->
          <div class="splash-book-rig splash-book-left">
            <div class="splash-book-3d">
              <div class="sp-cover-front sp-red">
                <div class="sp-cover-border">
                  <span class="sp-mark">TOWBAM</span>
                  <div class="sp-icon">
                    <svg width="32" height="32" viewBox="0 0 48 48" aria-hidden="true">
                      <circle cx="24" cy="17" r="6" fill="#f0c987" />
                      <path d="M10 27l14 3.5v9.5L10 36.5zM38 27l-14 3.5v9.5l14-3.5z" fill="#fbf8f1" />
                    </svg>
                  </div>
                  <span class="sp-title">Des histoires<br>qui méritent d'être lues</span>
                </div>
              </div>
              <div class="sp-tranche-right"></div>
              <div class="sp-tranche-top"></div>
              <div class="sp-spine sp-red-spine"></div>
              <div class="sp-cover-back sp-red-dark"></div>
            </div>
          </div>

          <!-- Second Livre 3D : Ivoire & Terre Chaude / Arrière-Plan -->
          <div class="splash-book-rig splash-book-right">
            <div class="splash-book-3d">
              <div class="sp-cover-front sp-ivory">
                <div class="sp-cover-border">
                  <span class="sp-mark sp-dark">TOWBAM</span>
                  <div class="sp-icon">
                    <svg width="32" height="32" viewBox="0 0 48 48" aria-hidden="true">
                      <rect width="48" height="48" rx="12" fill="#2d2218" />
                      <circle cx="24" cy="17" r="6" fill="#f0c987" />
                      <path d="M10 27l14 3.5v9.5L10 36.5zM38 27l-14 3.5v9.5l14-3.5z" fill="#fbf8f1" />
                    </svg>
                  </div>
                  <span class="sp-title sp-dark">Voix &amp; Plumes<br>d'Afrique</span>
                </div>
              </div>
              <div class="sp-tranche-right"></div>
              <div class="sp-tranche-top"></div>
              <div class="sp-spine sp-ivory-spine"></div>
              <div class="sp-cover-back sp-ivory-dark"></div>
            </div>
          </div>

          <!-- Révélation de la marque TOWBAM avec logo officiel au centre -->
          <div class="splash-brand">
            <div class="splash-emblem">
              <svg width="68" height="68" viewBox="0 0 48 48" aria-hidden="true">
                <rect width="48" height="48" rx="13" fill="#c0392b" />
                <circle cx="24" cy="17" r="7.5" fill="#f0c987" />
                <path d="M8 27l16 4v12L8 39zM40 27l-16 4v12l16-4z" fill="#f6f2ea" />
                <path d="M24 31v12" stroke="#c0392b" stroke-width="1.5" />
              </svg>
            </div>
            <h1 class="splash-wordmark">towbam</h1>
            <p class="splash-tagline">Des histoires qui méritent d'être lues</p>
          </div>
        </div>
      `;

      document.body.appendChild(splash);
      sessionStorage.setItem('towbam_splash_shown', 'true');

      // Phase 6 : Transition douce vers la page d'accueil à 2.6s
      window.setTimeout(() => {
        splash.classList.add('fade-out');
      }, 2600);

      // Suppression complète du DOM à 3.25s pour libérer les ressources
      window.setTimeout(() => {
        if (splash && splash.parentNode) {
          splash.remove();
        }
      }, 3250);
    } catch (error) {
      console.warn('Splash screen error:', error);
    }
  }

  // Export sur window pour l'application
  window.TowbamBook3D = {
    getHeroBookHTML,
    initSplashScreen
  };

  // Helper pour rejouer l'animation en direct (ex: console ou test)
  window.replaySplash = function () {
    initSplashScreen({ force: true });
  };
})();
