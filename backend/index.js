require('dotenv').config(); // ต้องอยู่ด้านบนสุดของไฟล์
// Import necessary modules
const express = require('express'); // Express framework for handling routes and server logic
const path = require('path'); // Path module for working with file and directory paths
const fs = require('fs').promises; // File system module with promise-based methods for async operations
const bodyParser = require('body-parser'); // Middleware to parse incoming request bodies
const cookieParser = require('cookie-parser'); // Middleware to parse cookies
const session = require('express-session'); // Middleware for session management
const cors = require('cors'); // Middleware for enabling Cross-Origin Resource Sharing

// Define the port the server will listen on
const PORT = 3001;

// Initialize the Express application
const app = express();

// Define the root directory for content files
const CONTENT_ROOT = path.join(__dirname, 'content');


const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;
// --- Middleware Setup ---

// Enable CORS for the frontend application
// Allows requests from 'http://localhost:5173' (default Vite dev server)
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true // Allow cookies to be sent with requests
}));

// Use body-parser middleware to parse JSON and URL-encoded request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use cookie-parser middleware to parse cookies
app.use(cookieParser());

// Configure express-session for session management
app.use(session({
    secret: SESSION_SECRET, // Secret key to sign the session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Set to true in production (requires HTTPS)
        httpOnly: true, // Prevent client-side JavaScript from accessing cookies
        maxAge: 1000 * 60 * 60 * 24 // Session lasts for 24 hours
    }
}));

// --- Authentication Middleware ---

/**
 * Middleware to check if the user is authenticated.
 * If not authenticated, sends a 401 Unauthorized response.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const requireAuth = (req, res, next) => {
    if (req.session && req.session.isAuthenticated) {
        next(); // User is authenticated, proceed to the next middleware/route handler
    } else {
        res.status(401).json({ message: 'Unauthorized' }); // User not authenticated
    }
};

// --- Helper Functions ---

/**
 * Recursively walks a directory and builds a JSON tree structure.
 * @param {string} currentPath - The current path to walk.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of file/folder objects.
 */
async function walkDir(currentPath) {
    let tree = [];
    try {
        const items = await fs.readdir(currentPath, { withFileTypes: true }); // Read directory contents

        for (const item of items) {
            const itemPath = path.join(currentPath, item.name); // Full path to the item
            const relativePath = path.relative(CONTENT_ROOT, itemPath); // Path relative to CONTENT_ROOT

            if (item.isDirectory()) {
                // If it's a directory, recursively walk it
                tree.push({
                    name: item.name,
                    path: relativePath.replace(/\\/g, '/'), // Use forward slashes for paths
                    type: 'folder',
                    children: await walkDir(itemPath) // Recursively get children
                });
            } else if (item.isFile() && item.name.endsWith('.md')) {
                // If it's a Markdown file
                tree.push({
                    name: item.name,
                    path: relativePath.replace(/\\/g, '/'), // Use forward slashes for paths
                    type: 'file'
                });
            }
        }
        // Sort files and folders alphabetically, folders first
        tree.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });
    } catch (error) {
        console.error(`Error walking directory ${currentPath}:`, error);
        // Return empty tree if directory doesn't exist or is inaccessible
        return [];
    }
    return tree;
}

/**
 * Validates a given path to ensure it stays within the CONTENT_ROOT.
 * @param {string} requestedPath - The path requested by the client (e.g., from query parameter).
 * @returns {string|null} The absolute, safe path within CONTENT_ROOT, or null if invalid.
 */
function getSafePath(requestedPath) {
    if (!requestedPath) {
        // If path is empty, default to home.md or return null if it's a critical operation without a path
        if (requestedPath === "") { // For root tree, allow empty path
            return CONTENT_ROOT;
        }
        return null;
    }

    // Normalize the path (e.g., resolve '..' and '.')
    const normalizedPath = path.normalize(requestedPath);

    // Construct the full absolute path
    const absolutePath = path.join(CONTENT_ROOT, normalizedPath);

    // Check if the absolute path starts with the CONTENT_ROOT,
    // which ensures it doesn't try to access files outside the content directory.
    // Also, ensure no '..' attempts to go above CONTENT_ROOT.
    if (absolutePath.startsWith(CONTENT_ROOT) && !path.relative(CONTENT_ROOT, absolutePath).startsWith('..')) {
        return absolutePath;
    }
    return null; // Path is invalid or outside allowed directory
}


// --- API Routes ---

/**
 * GET /api/check-auth
 * Checks if the user is currently authenticated.
 * Returns { isAuthenticated: true } if logged in, otherwise { isAuthenticated: false }.
 */
app.get('/api/check-auth', (req, res) => {
    res.json({ isAuthenticated: req.session && req.session.isAuthenticated });
});

/**
 * GET /api/tree
 * Returns the file and folder structure of the 'content' directory as a JSON tree.
 */
app.get('/api/tree', async (req, res) => {
    try {
        const tree = await walkDir(CONTENT_ROOT);
        res.json(tree);
    } catch (error) {
        console.error('Error fetching file tree:', error);
        res.status(500).json({ message: 'Failed to fetch file tree' });
    }
});

/**
 * GET /api/all-content-paths
 * Returns a list of all Markdown file paths and their contents.
 * Used for client-side search indexing.
 */
app.get('/api/all-content-paths', async (req, res) => {
    async function getAllMdFiles(currentDir) {
        let files = [];
        const items = await fs.readdir(currentDir, { withFileTypes: true });
        for (const item of items) {
            const itemPath = path.join(currentDir, item.name);
            const relativePath = path.relative(CONTENT_ROOT, itemPath).replace(/\\/g, '/');
            if (item.isFile() && item.name.endsWith('.md')) {
                const content = await fs.readFile(itemPath, 'utf8');
                files.push({ path: relativePath, content: content });
            } else if (item.isDirectory()) {
                files = files.concat(await getAllMdFiles(itemPath));
            }
        }
        return files;
    }

    try {
        const allFiles = await getAllMdFiles(CONTENT_ROOT);
        res.json(allFiles);
    } catch (error) {
        console.error('Error fetching all content paths:', error);
        res.status(500).json({ message: 'Failed to fetch all content paths' });
    }
});

/**
 * GET /api/file
 * Reads and returns the content of a Markdown file.
 * Requires 'path' query parameter, e.g., /api/file?path=folder/file.md
 */
app.get('/api/file', async (req, res) => {
    const requestedPath = req.query.path;
    const filePath = getSafePath(requestedPath);

    if (!filePath) {
        return res.status(400).json({ message: 'Invalid file path' });
    }

    try {
        const data = await fs.readFile(filePath, 'utf8');
        res.send(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ message: 'File not found' });
        }
        console.error(`Error reading file ${filePath}:`, error);
        res.status(500).json({ message: 'Failed to read file' });
    }
});

/**
 * POST /api/file
 * Saves new content to a Markdown file or creates a new file.
 * Requires authentication.
 * Body: { path: 'folder/file.md', content: '# New content' }
 */
app.post('/api/file', requireAuth, async (req, res) => {
    const requestedPath = req.body.path;
    const fileContent = req.body.content;

    const filePath = getSafePath(requestedPath);

    if (!filePath) {
        return res.status(400).json({ message: 'Invalid file path' });
    }
    if (typeof fileContent !== 'string') {
        return res.status(400).json({ message: 'Content must be a string' });
    }
    if (!filePath.endsWith('.md')) {
        return res.status(400).json({ message: 'Only Markdown files (.md) are allowed' });
    }

    try {
        const dir = path.dirname(filePath); // Get the directory of the file
        await fs.mkdir(dir, { recursive: true }); // Create directory if it doesn't exist
        await fs.writeFile(filePath, fileContent, 'utf8'); // Write content to file
        res.json({ message: 'File saved successfully' });
    } catch (error) {
        console.error(`Error saving file ${filePath}:`, error);
        res.status(500).json({ message: 'Failed to save file' });
    }
});

/**
 * POST /api/folder
 * Creates a new empty folder.
 * Requires authentication.
 * Body: { path: 'new-folder-name' }
 */
app.post('/api/folder', requireAuth, async (req, res) => {
    const requestedPath = req.body.path;
    const folderPath = getSafePath(requestedPath);

    if (!folderPath) {
        return res.status(400).json({ message: 'Invalid folder path' });
    }

    try {
        await fs.mkdir(folderPath, { recursive: true }); // Create the folder
        res.json({ message: 'Folder created successfully' });
    } catch (error) {
        console.error(`Error creating folder ${folderPath}:`, error);
        res.status(500).json({ message: 'Failed to create folder' });
    }
});

/**
 * DELETE /api/file
 * Deletes a Markdown file or an empty folder.
 * Requires authentication.
 * Requires 'path' query parameter, e.g., /api/file?path=folder/file.md
 */
app.delete('/api/file', requireAuth, async (req, res) => {
    const requestedPath = req.query.path;
    const targetPath = getSafePath(requestedPath);

    if (!targetPath) {
        return res.status(400).json({ message: 'Invalid path' });
    }

    try {
        const stats = await fs.stat(targetPath); // Get file stats to check if it's a file or directory
        if (stats.isFile() && targetPath.endsWith('.md')) {
            await fs.unlink(targetPath); // Delete the file
            res.json({ message: 'File deleted successfully' });
        } else if (stats.isDirectory()) {
            // Check if directory is empty before deleting
            const files = await fs.readdir(targetPath);
            if (files.length === 0) {
                await fs.rmdir(targetPath); // Delete the empty directory
                res.json({ message: 'Empty folder deleted successfully' });
            } else {
                return res.status(400).json({ message: 'Folder is not empty and cannot be deleted' });
            }
        } else {
            return res.status(400).json({ message: 'Invalid delete target (only .md files or empty folders)' });
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ message: 'Target not found' });
        }
        console.error(`Error deleting ${targetPath}:`, error);
        res.status(500).json({ message: 'Failed to delete' });
    }
});

/**
 * POST /api/login
 * Handles user login.
 * Body: { username, password }
 */
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Simple hardcoded credentials for demonstration
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAuthenticated = true; // Set session flag
        res.json({ message: 'Login successful' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

/**
 * POST /api/logout
 * Handles user logout.
 * Destroys the session.
 */
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: 'Failed to log out' });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ message: 'Logged out successfully' });
    });
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
