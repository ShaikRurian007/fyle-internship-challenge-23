import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit, QueryList,
  Renderer2,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {ApiService} from "./services/api.service";
import {HttpClient, HttpClientModule} from "@angular/common/http";


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent  implements OnInit, AfterViewInit{


  title = 'fyle-reloaded';

  @ViewChild('themeBtn', { static: true }) themeBtn!: ElementRef;

  isPressed = false;
  isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  constructor(private renderer: Renderer2, private api: ApiService,private httpClient: HttpClient ) {}

  ngOnInit() {
    this.initializeTheme();
    this.updateProfile(this.apiUrl);
  }


  ngAfterViewInit() {
    this.setupScrollListener();
    this.lastActiveTabBtn = this.tabBtns.first;
    this.lastActiveTabPanel = this.tabPanels.first;
    this.setupClickEventsOnTabs();
    this.setupKeydownEventsOnTabs();

    this.searchField.nativeElement.value = "google"
    this.searchUser()

  }




  initializeTheme() {
    const storedTheme = sessionStorage.getItem('theme');

    if (storedTheme) {
      this.applyTheme(storedTheme);
    } else {
      this.applyTheme(this.isDark ? 'dark' : 'light');
    }
  }

  applyTheme(theme: string) {
    this.renderer.setAttribute(this.themeBtn!.nativeElement, 'aria-pressed', this.isPressed.toString());
    this.renderer.setAttribute(document.documentElement, 'data-theme', theme);
    sessionStorage.setItem('theme', theme);
  }

  changeTheme() {
    this.isPressed = !this.isPressed;
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
  }



  //header

  @ViewChild('header', { static: true }) header!: ElementRef;
  @ViewChild('searchToggler', { static: true }) searchToggler!: ElementRef;
  @ViewChild('searchField', { static: true }) searchField!: ElementRef;

  isExpanded = false;



  setupScrollListener() {
    this.renderer.listen('window', 'scroll', () => {
      this.renderer.addClass(
        this.header.nativeElement,
        window.scrollY > 50 ? 'active' : ''
      );
      this.renderer.removeClass(
        this.header.nativeElement,
        window.scrollY > 50 ? '' : 'active'
      );
    });
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: Event) {
    const target = event.target as HTMLElement;

    if (this.searchToggler.nativeElement.contains(target)) {
      this.toggleSearch();
    } else if (!this.searchField.nativeElement.contains(target)) {
      this.closeSearch();
    }
  }

  toggleSearch() {
    this.renderer.addClass(this.header.nativeElement, 'search-active');
    this.isExpanded = !this.isExpanded;
    this.renderer.setAttribute(
      this.searchToggler.nativeElement,
      'aria-expanded',
      this.isExpanded.toString()
    );
    this.searchField.nativeElement.focus();
  }

  closeSearch() {
    this.renderer.removeClass(this.header.nativeElement, 'search-active');
    this.isExpanded = false;
    this.renderer.setAttribute(
      this.searchToggler.nativeElement,
      'aria-expanded',
      'false'
    );
  }



  ///

  @ViewChildren('dataTabButton') tabBtns!: QueryList<ElementRef>;
  @ViewChildren('dataTabPanel') tabPanels!: QueryList<ElementRef>;

  lastActiveTabBtn?: ElementRef
  lastActiveTabPanel?: ElementRef

  setupClickEventsOnTabs() {
    this.tabBtns.forEach(tabBtn => {
      this.renderer.listen(tabBtn.nativeElement, 'click', () => {
        this.lastActiveTabBtn!.nativeElement.setAttribute('aria-selected', 'false');
        this.lastActiveTabPanel!.nativeElement.setAttribute('hidden', '');

        tabBtn.nativeElement.setAttribute('aria-selected', 'true');
        const currentTabPanel = this.tabPanels.find(panel =>
          panel.nativeElement.id === tabBtn.nativeElement.getAttribute('aria-controls')
        );
        currentTabPanel!.nativeElement.removeAttribute('hidden');

        this.lastActiveTabBtn = tabBtn;
        this.lastActiveTabPanel = currentTabPanel;
      });
    });
  }


  setupKeydownEventsOnTabs() {
    this.tabBtns.forEach((tabBtn, index) => {
      this.renderer.listen(tabBtn.nativeElement, 'keydown', (event: KeyboardEvent) => {
        const nextElement = this.tabBtns.get(index + 1);
        const previousElement = this.tabBtns.get(index - 1)

        if (event.key === 'ArrowRight' && nextElement) {
          this.setFocus(tabBtn.nativeElement, '-1');
          this.setFocus(nextElement, '0');
        } else if (event.key === 'ArrowLeft' && previousElement) {
          this.setFocus(tabBtn.nativeElement, '-1');
          this.setFocus(previousElement, '0');
        }
      });
    });
  }

  setFocus(element: ElementRef, tabindex: string) {
    this.renderer.setAttribute(element.nativeElement, 'tabindex', tabindex);
    element.nativeElement.click();
  }


  @HostListener('document:keydown', ['$event'])
  handleDocumentKeyDown(event: KeyboardEvent) {
    const focusedElement = document.activeElement;

    if (this.tabBtns.some(btn => btn.nativeElement === focusedElement)) {
      // Prevent browser default behavior for arrow keys
      event.preventDefault();
    }
  }



  //search

  @ViewChild('dataSearchSubmit') searchSubmit!: ElementRef;

  apiUrl: string = "https://api.github.com/users/facebook";
  repoUrl?: string;
  followerUrl?: string;
  followingUrl: string = "";
  totalReposCount: number = 0;


  searchUser() {
    if (!this.searchField.nativeElement.value) return;

    this.apiUrl = `https://api.github.com/users/${this.searchField.nativeElement.value}`;
    this.updateProfile(this.apiUrl);
  }





  //fetching data and profile



  @ViewChild('profileCard') profileCard!: ElementRef;
  @ViewChild('dataRepoPanel') repoPanel!: ElementRef;
  @ViewChild('error1') error!: ElementRef;



  updateProfile(profileUrl: string) {
    // this.error.nativeElement.style.display = "none";
    document.body.style.overflowY = "visible";

    this.renderer.setProperty(this.profileCard.nativeElement, 'innerHTML', `
      <div class="profile-skeleton">
        <div class="skeleton avatar-skeleton"></div>
        <div class="skeleton title-skeleton"></div>
        <div class="skeleton text-skeleton text-1"></div>
        <div class="skeleton text-skeleton text-2"></div>
        <div class="skeleton text-skeleton text-3"></div>
      </div>
    `);

    // Assuming $tabBtns is declared and contains the necessary logic
    this.tabPanels.first.nativeElement.click();

    this.renderer.setProperty(this.repoPanel.nativeElement, 'innerHTML', `
      <div class="card repo-skeleton">
        <div class="card-body">
          <div class="skeleton title-skeleton"></div>
          <div class="skeleton text-skeleton text-1"></div>
          <div class="skeleton text-skeleton text-2"></div>
        </div>
        <div class="card-footer">
          <div class="skeleton text-skeleton"></div>
          <div class="skeleton text-skeleton"></div>
          <div class="skeleton text-skeleton"></div>
        </div>
      </div>
    `.repeat(6));

    this.api.fetchData(profileUrl)
      .then((data: any) => {
        const {
          type,
          avatar_url,
          name,
          login: username,
          html_url: githubPage,
          bio,
          location,
          company,
          blog: website,
          twitter_username,
          public_repos,
          followers,
          following,
          followers_url,
          following_url,
          repos_url,
        } = data;

        this.repoUrl = repos_url;
        this.followerUrl = followers_url;
        this.followingUrl = following_url.replace("{/other_user}", "");
        this.totalReposCount = public_repos;

        this.renderer.setProperty(this.profileCard.nativeElement, 'innerHTML', `
          <figure class="${type === "User" ? "avatar-circle" : "avatar-rounded"} img-holder" style="--width:280; --height: 280" >
            <img src="${avatar_url}" width="280" height="280" alt="${username}" class="img-cover">
          </figure>
          ${name ? `<h1 class="title-2">${name}</h1>` : ""}
          <p class="username text-primary">${username}</p>
          ${bio ? `<p class="bio">${bio}</p>` : ""}
          <a href="${githubPage}" target="_blank" class="btn btn-secondary">
            <span class="material-symbols-rounded" aria-hidden="true">open_in_new</span>
            <span class="span">See on Github</span>
          </a>
          <ul class="profile-meta">
            ${location ? `<li class="meta-item">
              <span class="material-symbols-rounded" aria-hidden="true">Location_on</span>
              <span class="meta-text">${location}</span>
            </li>` : ""}
            ${company ? `<li class="meta-item">
              <span class="material-symbols-rounded" aria-hidden="true">apartment</span>
              <span class="meta-text">${company}</span>
            </li>` : ""}
            ${website ? `<li class="meta-item">
              <span class="material-symbols-rounded" aria-hidden="true">captive_portal</span>
              <a href="${website}" target="_blank" class="meta-text">${website.replace("https://", "")}</a>
            </li>` : ""}
            ${twitter_username ? `<li class="meta-item">
              <span class="icon"><svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.9441 7.92638C19.9568 8.10403 19.9568 8.28173 19.9568 8.45938C19.9568 13.8781 15.8325 20.1218 8.29441 20.1218C5.97207 20.1218 3.81473 19.4492 2 18.2817C2.32996 18.3198 2.64719 18.3325 2.98984 18.3325C4.90605 18.3325 6.67004 17.6853 8.07867 16.5812C6.27664 16.5431 4.76648 15.3629 4.24617 13.7386C4.5 13.7766 4.75379 13.802 5.02031 13.802C5.38832 13.802 5.75637 13.7512 6.09898 13.6624C4.22082 13.2817 2.81215 11.632 2.81215 9.63958V9.58884C3.35781 9.89341 3.99238 10.0838 4.66492 10.1091C3.56086 9.37306 2.83754 8.11673 2.83754 6.6954C2.83754 5.93399 3.04055 5.23603 3.3959 4.62688C5.41367 7.11419 8.44668 8.73853 11.8477 8.91622C11.7842 8.61165 11.7461 8.29442 11.7461 7.97716C11.7461 5.71825 13.5736 3.87817 15.8451 3.87817C17.0253 3.87817 18.0913 4.3731 18.84 5.17259C19.7664 4.99493 20.6547 4.65228 21.4416 4.18274C21.137 5.13454 20.4898 5.93403 19.6395 6.44161C20.4644 6.35282 21.2639 6.12435 21.9999 5.80712C21.4416 6.61927 20.7436 7.34259 19.9441 7.92638Z" fill="var(--on-background)"></path>
              </svg></span>
              <a href="https://twitter.com/${twitter_username}" target="_blank" class="meta-text">@${twitter_username}</a>
            </li>` : ""}
          </ul>
          <ul class="profile-stats">
            <li class="stats-item">
              <span class="body">${public_repos}</span> Repos
            </li>
            <li class="stats-item">
              <span class="body">${followers}</span> Followers
            </li>
            <li class="stats-item">
              <span class="body">${following}</span> Following
            </li>
          </ul>
          <div class="footer containerfoo">
            <a href="https://github.com/ShaikRurian007" target="_blank" class="meta-text">
              <p class="copyright"> &copy; 2024 anees</p>
            </a>
          </div>
        `);

        this.updateRepository();
      })
      .catch(() => {
        this.error.nativeElement.style.display = "grid";
        document.body.style.overflowY = "hidden";
        this.renderer.setProperty(this.error.nativeElement, 'innerHTML', `
          <p class="title-1">Oops! :(</p>
          <p class="text">
            There is no account with this username yet.
          </p>
        `);
      });
  }


  //update repository

  forkedRepos: any[] = [];

  per_page: number = 10

  async updateRepository(page: number = 1) {
    const paginationUrl = `${(this.repoUrl)}?sort=created&per_page=${this.per_page}&page=${page}`;

    try {
      const data = await this.api.fetchData(paginationUrl);
      this.repoPanel.nativeElement.innerHTML = `<h2 class="sr-only">Repositories</h2>`;

      this.forkedRepos = data.filter((item: { fork: any; }) => item.fork);
      const repositories = data;

      if (repositories.length) {
        for (const repo of repositories) {
          const {
            name,
            html_url,
            description,
            private: isPrivate,
            language,
            stargazers_count: stars_count,
            forks_count,
          } = repo;

          const $repoCard = this.renderer.createElement('article');
          this.renderer.addClass($repoCard, 'card');
          this.renderer.addClass($repoCard, 'repo-card');

          this.renderer.setProperty($repoCard, 'innerHTML', `
            <div class="card-body">
              <a href="${html_url}" target="_blank" class="card-title">
                <h3 class="title-3">${name}</h3>
              </a>
              ${description ? `<p class="card-text">${description}</p>` : ""}
              <span class="badge">${isPrivate ? "Private" : "Public"}</span>
            </div>
            <div class="card-footer">
              ${language ? `<div class="meta-item">
                <span class="material-symbols-rounded" aria-hidden="true">code_blocks</span>
                <span class="span">${language}</span>
              </div>` : ""}
              <div class="meta-item">
                <span class="material-symbols-rounded" aria-hidden="true">star_rate</span>
                <span class="span">${stars_count}</span>
              </div>
              <div class="meta-item">
                <span class="material-symbols-rounded" aria-hidden="true">family_history</span>
                <span class="span">${forks_count}</span>
              </div>
            </div>
          `);

          this.renderer.appendChild(this.repoPanel.nativeElement, $repoCard);
        }

        this.createPaginationLinks(page, this.per_page);
      } else {
        this.repoPanel.nativeElement.innerHTML = `
          <div class="error-content">
            <p class="title-1">Oops! :(</p>
            <p class="text">Doesn't have any public repositories yet.</p>
          </div>`;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Handle error as needed
    }
  }

  @ViewChild('pagination') pagination!: ElementRef;

  createPaginationLinks(currentPage: number, perPage: number) {
    const totalPages = Math.ceil(this.totalReposCount / perPage);
    this.pagination.nativeElement.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
      const $pageLink = this.renderer.createElement('a');
      this.renderer.setProperty($pageLink, 'href', '#'); // Add actual link logic
      this.renderer.setProperty($pageLink, 'textContent', i.toString());

      this.renderer.listen($pageLink, 'click', ()  => {
        this.updateRepository(i)
      });

      if (i === currentPage) {
        this.renderer.addClass($pageLink, 'active');
      }

      this.renderer.appendChild(this.pagination.nativeElement, $pageLink);
    }
  }

  updatePerPage(event:any) {
    this.per_page=event.target.value
    this.updateRepository(1)
  }



  //forked repo

  @ViewChild('forkPanel', { static: true }) forkePanel!: ElementRef;
  @ViewChild('forkTabButton', { static: true }) forkTabBtn!: ElementRef;



  updateForkRepo() {
    this.renderer.setProperty(this.forkePanel.nativeElement, 'innerHTML', `<h2 class="sr-only">Forked repositories</h2>`);

    if (this.forkedRepos.length) {
      for (const repo of this.forkedRepos) {
        const {
          name,
          html_url,
          description,
          private: isPrivate,
          language,
          stargazers_count: stars_count,
          forks_count,
        } = repo;

        const $forkCard = this.renderer.createElement('article');
        this.renderer.addClass($forkCard, 'card');
        this.renderer.addClass($forkCard, 'repo-card');

        this.renderer.setProperty($forkCard, 'innerHTML', `
          <div class="card-body">
            <a href="${html_url}" target="_blank" class="card-title">
              <h3 class="title-3">${name}</h3>
            </a>
            ${description ? `<p class="card-text">${description}</p>` : ""}
            <span class="badge">${isPrivate ? "Private" : "Public"}</span>
          </div>
          <div class="card-footer">
            ${language ? `<div class="meta-item">
              <span class="material-symbols-rounded" aria-hidden="true">code_blocks</span>
              <span class="span">${language}</span>
            </div>` : ""}
            <div class="meta-item">
              <span class="material-symbols-rounded" aria-hidden="true">star_rate</span>
              <span class="span">${stars_count}</span>
            </div>
            <div class="meta-item">
              <span class="material-symbols-rounded" aria-hidden="true">family_history</span>
              <span class="span">${forks_count}</span>
            </div>
          </div>
        `);

        this.renderer.appendChild(this.forkePanel.nativeElement, $forkCard);
      }
    } else {
      this.renderer.setProperty(this.forkePanel.nativeElement, 'innerHTML', `
        <div class="error-content">
          <p class="title-1">Oops! :(</p>
          <p class="text">Doesn't have any forked repositories yet.</p>
        </div>
      `);
    }
  }


  //followers

  @ViewChild('followerTabButton', { static: true }) followerTabBtn!: ElementRef;
  @ViewChild('followerPanel', { static: true }) followerPanel!: ElementRef;
  @ViewChild('followingTabBtn', { static: true }) followingTabBtn!: ElementRef;
  @ViewChild('followingPanel', { static: true }) followingPanel!: ElementRef;


  updateFollower() {
    this.renderer.setProperty(this.followerPanel.nativeElement, 'innerHTML', `
      <div class="card follower-skeleton">
        <div class="skeleton avatar-skeleton"></div>
        <div class="skeleton title-skeleton"></div>
      </div>`.repeat(12));

    this.httpClient.get<any[]>(this.followerUrl!).subscribe(data => {
      this.renderer.setProperty(this.followerPanel.nativeElement, 'innerHTML', `<h2 class="sr-only">Followers</h2>`);

      if (data.length) {
        for (const item of data) {
          const { login: username, avatar_url, url } = item;

          const $followerCard = this.renderer.createElement('article');
          this.renderer.addClass($followerCard, 'card');
          this.renderer.addClass($followerCard, 'follower-card');

          this.renderer.setProperty($followerCard, 'innerHTML', `
            <figure class="avatar-circle img-holder">
              <img src="${avatar_url}" width="56" height="56" loading="lazy" alt="${username}" class="img-cover">
            </figure>
            <h3 class="card-title">${username}</h3>
            <button class="icon-btn" (click)="updateProfile('${url}')" aria-label="Go to ${username} profile">
              <span class="material-symbols-rounded" aria-hidden="true">Link</span>
            </button>`);

          this.renderer.appendChild(this.followerPanel.nativeElement, $followerCard);
        }
      } else {
        this.renderer.setProperty(this.followerPanel.nativeElement, 'innerHTML', `
          <div class="error-content">
            <p class="title-1">Oops! :(</p>
            <p class="text">Doesn't have any follower yet.</p>
          </div>`);
      }
    });
  }

  updateFollowing(){

    this.renderer.setProperty(this.followingPanel.nativeElement, 'innerHTML', `
      <div class="card follower-skeleton">
        <div class="skeleton avatar-skeleton"></div>
        <div class="skeleton title-skeleton"></div>
      </div>`.repeat(12));

    this.httpClient.get<any[]>(this.followingUrl).subscribe(data => {
      this.renderer.setProperty(this.followingPanel.nativeElement, 'innerHTML', `<h2 class="sr-only">Following</h2>`);

      if (data.length) {
        for (const item of data) {
          const { login: username, avatar_url, url } = item;

          const $followingCard = this.renderer.createElement('article');
          this.renderer.addClass($followingCard, 'card');
          this.renderer.addClass($followingCard, 'follower-card');

          this.renderer.setProperty($followingCard, 'innerHTML', `
            <figure class="avatar-circle img-holder">
              <img src="${avatar_url}" width="56" height="56" loading="lazy" alt="${username}" class="img-cover">
            </figure>
            <h3 class="card-title">${username}</h3>
            <button class="icon-btn" (click)="updateProfile('${url}')" aria-label="Go to ${username} profile">
              <span class="material-symbols-rounded" aria-hidden="true">Link</span>
            </button>`);

          this.renderer.appendChild(this.followingPanel.nativeElement, $followingCard);
        }
      } else {
        this.renderer.setProperty(this.followingPanel.nativeElement, 'innerHTML', `
          <div class="error-content">
            <p class="title-1">Oops! :(</p>
            <p class="text">Doesn't have any following yet.</p>
          </div>`);
      }
    });
  }



}
