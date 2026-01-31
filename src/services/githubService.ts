export interface GitHubUser {
  login: string;
  name: string;
  avatar: string;
  repos: number;
  followers: number;
  following: number;
}

class GitHubService {
  private connectedUser: GitHubUser | null = null;
  private readonly GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
  private readonly REDIRECT_URI = `${window.location.origin}/dashboard/settings`;

  isConnected(): boolean {
    const stored = localStorage.getItem('github_user');
    if (stored) {
      try {
        this.connectedUser = JSON.parse(stored);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  getConnectedUser(): GitHubUser | null {
    if (this.connectedUser) return this.connectedUser;
    
    const stored = localStorage.getItem('github_user');
    if (stored) {
      try {
        this.connectedUser = JSON.parse(stored);
        return this.connectedUser;
      } catch {
        return null;
      }
    }
    return null;
  }

  async connectGitHub(): Promise<{ success: boolean; message: string }> {
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${this.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}&scope=user,repo`;
    
    const popup = window.open(authUrl, 'GitHub OAuth', 'width=600,height=700');
    
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkInterval);
          const stored = localStorage.getItem('github_user');
          if (stored) {
            try {
              this.connectedUser = JSON.parse(stored);
              resolve({ 
                success: true, 
                message: 'Successfully connected to GitHub!' 
              });
            } catch {
              resolve({ 
                success: false, 
                message: 'Failed to connect to GitHub' 
              });
            }
          } else {
            resolve({ 
              success: false, 
              message: 'GitHub authentication cancelled' 
            });
          }
        }
      }, 500);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (popup && !popup.closed) {
          popup.close();
        }
        resolve({ 
          success: false, 
          message: 'GitHub authentication timeout' 
        });
      }, 60000);
    });
  }

  async disconnectGitHub(): Promise<void> {
    this.connectedUser = null;
    localStorage.removeItem('github_user');
  }

  async getRepositories(): Promise<unknown[]> {
    if (!this.isConnected()) {
      return [];
    }
    return [];
  }
}

export const githubService = new GitHubService();
