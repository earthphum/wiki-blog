// App.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, task lists, etc.)
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; // For code block syntax highlighting
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism'; // A syntax highlighting style
import lunr from 'lunr'; // For client-side full-text search

// Base URL for the backend API
const API_BASE_URL = 'http://localhost:3001/api';

// Translation content
const translations = {
    en: {
        wikiExplorer: "Wiki Explorer",
        searchWiki: "Search wiki...",
        noResults: "No results found or content available.",
        switchToDark: "Switch to Dark Mode",
        switchToLight: "Switch to Light Mode",
        newFileFolder: "New File/Folder",
        logout: "Logout",
        login: "Login",
        selectAFile: "Select a file",
        edit: "Edit",
        save: "Save",
        cancel: "Cancel",
        deleteCurrent: "Delete Current",
        youMustBeLoggedIn: "You must be logged in to save files.",
        noFileSelected: "No file selected to save.",
        failedToSave: "Failed to save file.",
        confirmDelete: "Are you sure you want to delete {type} \"{path}\"?",
        failedToDelete: "Failed to delete file/folder. Make sure folder is empty.",
        createNewLabel: "Create New {type}",
        parentPath: "Parent Path:",
        root: "root",
        file: "File",
        folder: "Folder",
        fileNamePlaceholder: "File Name (e.g., my-new-doc.md)",
        folderNamePlaceholder: "Folder Name (e.g., MyNewFolder)",
        initialContentOptional: "Initial content (optional)",
        nameCannotBeEmpty: "Name cannot be empty.",
        fileMustBeMarkdown: "New file must be a Markdown file (.md).",
        directFolderCreationWarning: "Direct folder creation is not supported via this modal. Folders are created automatically when saving a file in a new path.",
        failedToCreate: "Failed to create new item. Check name and permissions.",
        welcomeMessage: "Start writing your Markdown content here... Type /code, /title, /body, or /bordered for snippets.",
        tableOfContents: "Table of Contents",
        username: "Username (admin)",
        password: "Password (password)",
        loginSuccessful: "Login successful",
        loginFailed: "Login failed.",
        unauthorized: "Unauthorized",
        logoutSuccessful: "Logged out successfully",
        errorFetchingTree: "Error fetching file tree.",
        errorLoadingContent: "Error loading file content.",
        errorPreparingSearch: "Error preparing search index.",
        errorCheckingAuth: "Error checking authentication status.",
        hidePreview: "Hide Preview",
        showPreview: "Show Preview",
        create: "Create"
    },
    th: {
        wikiExplorer: "คลังความรู้ส่วนตัว",
        searchWiki: "ค้นหาคลังความรู้...",
        noResults: "ไม่พบผลลัพธ์หรือเนื้อหาที่ใช้ได้",
        switchToDark: "สลับเป็นโหมดมืด",
        switchToLight: "สลับเป็นโหมดสว่าง",
        newFileFolder: "สร้างไฟล์/โฟลเดอร์ใหม่",
        logout: "ออกจากระบบ",
        login: "เข้าสู่ระบบ",
        selectAFile: "เลือกไฟล์",
        edit: "แก้ไข",
        save: "บันทึก",
        cancel: "ยกเลิก",
        deleteCurrent: "ลบไฟล์ปัจจุบัน",
        youMustBeLoggedIn: "คุณต้องเข้าสู่ระบบเพื่อบันทึกไฟล์",
        noFileSelected: "ไม่มีไฟล์ที่เลือกเพื่อบันทึก",
        failedToSave: "บันทึกไฟล์ไม่สำเร็จ",
        confirmDelete: "คุณแน่ใจหรือไม่ว่าต้องการลบ {type} \"{path}\"?",
        failedToDelete: "ลบไฟล์/โฟลเดอร์ไม่สำเร็จ โปรดตรวจสอบว่าโฟลเดอร์ว่างเปล่า",
        createNewLabel: "สร้าง {type} ใหม่",
        parentPath: "Parent path:",
        root: "รูท",
        file: "ไฟล์",
        folder: "โฟลเดอร์",
        fileNamePlaceholder: "ชื่อไฟล์ (เช่น my-new-doc.md)",
        folderNamePlaceholder: "ชื่อโฟลเดอร์ (เช่น โฟลเดอร์ใหม่)",
        initialContentOptional: "เนื้อหาเริ่มต้น (ไม่บังคับ)",
        nameCannotBeEmpty: "ชื่อต้องไม่ว่างเปล่า",
        fileMustBeMarkdown: "ไฟล์ใหม่ต้องเป็นไฟล์ Markdown (.md)",
        directFolderCreationWarning: "การสร้างโฟลเดอร์โดยตรงไม่รองรับผ่านโมดัลนี้ โฟลเดอร์จะถูกสร้างขึ้นโดยอัตโนมัติเมื่อบันทึกไฟล์ในเส้นทางใหม่",
        failedToCreate: "สร้างรายการใหม่ไม่สำเร็จ ตรวจสอบชื่อและสิทธิ์",
        welcomeMessage: "เริ่มเขียนเนื้อหา Markdown ของคุณที่นี่... พิมพ์ /code, /title, /body, หรือ /bordered เพื่อแทรกตัวอย่าง",
        tableOfContents: "สารบัญ",
        username: "ชื่อผู้ใช้ (admin)",
        password: "รหัสผ่าน (password)",
        loginSuccessful: "เข้าสู่ระบบสำเร็จ",
        loginFailed: "เข้าสู่ระบบล้มเหลว",
        unauthorized: "ไม่ได้รับอนุญาต",
        logoutSuccessful: "ออกจากระบบสำเร็จ",
        errorFetchingTree: "เกิดข้อผิดพลาดในการดึงโครงสร้างไฟล์",
        errorLoadingContent: "เกิดข้อผิดพลาดในการโหลดเนื้อหาไฟล์",
        errorPreparingSearch: "เกิดข้อผิดพลาดในการเตรียมดัชนีค้นหา",
        errorCheckingAuth: "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์",
        hidePreview: "ซ่อนพรีวิว",
        showPreview: "แสดงพรีวิว",
        create: "สร้าง"
    }
};

// Main App component
function App() {
    // State variables
    const [fileTree, setFileTree] = useState([]);
    const [currentFilePath, setCurrentFilePath] = useState('');
    const [currentFileContent, setCurrentFileContent] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showNewFileModal, setShowNewFileModal] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [newFileContent, setNewFileContent] = useState('');
    const [newFilePathParent, setNewFilePathParent] = useState('');
    const [newType, setNewType] = useState('file');

    const [searchTerm, setSearchTerm] = useState('');
    const [searchIndex, setSearchIndex] = useState(null);
    const [allFileContents, setAllFileContents] = useState([]);

    const [showPreview, setShowPreview] = useState(true);
    const [toc, setToc] = useState([]);

    const [theme, setTheme] = useState('light');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [lang, setLang] = useState('en'); // Language state: 'en' or 'th'

    // Ref for the textarea to manage cursor position
    const editorRef = useRef(null);

    // Translation helper function
    const t = useCallback((key, replacements = {}) => {
        let text = translations[lang][key] || key; // Fallback to key if not found
        for (const [placeholder, value] of Object.entries(replacements)) {
            text = text.replace(`{${placeholder}}`, value);
        }
        return text;
    }, [lang]);

    // --- API Calls ---

    /**
     * Fetches the file tree from the backend.
     * Updates the fileTree state.
     */
    const fetchFileTree = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/tree`);
            setFileTree(response.data);
            // If no file is currently selected, default to 'home.md'
            if (!currentFilePath) {
                const homePath = findHomeMd(response.data);
                if (homePath) {
                    setCurrentFilePath(homePath);
                    fetchFileContent(homePath);
                }
            }
        } catch (error) {
            console.error('Error fetching file tree:', error);
            setMessage(t('errorFetchingTree'));
        }
    }, [currentFilePath, t]);

    /**
     * Finds the 'home.md' file path in the tree.
     * @param {Array} tree - The file tree array.
     * @returns {string|null} The path to 'home.md' or null if not found.
     */
    const findHomeMd = (tree) => {
        for (const item of tree) {
            if (item.type === 'file' && item.name === 'home.md') {
                return item.path;
            }
            if (item.type === 'folder' && item.children) {
                const found = findHomeMd(item.children);
                if (found) return found;
            }
        }
        return null;
    };

    /**
     * Fetches the content of a specific Markdown file.
     * Updates currentFileContent and editContent states.
     * @param {string} filePath - The path of the file to fetch.
     */
    const fetchFileContent = async (filePath) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/file`, {
                params: { path: filePath }
            });
            setCurrentFileContent(response.data);
            setEditContent(response.data); // Initialize edit content with current file content
            setMessage('');
            generateTableOfContents(response.data); // Generate TOC for the loaded content
        } catch (error) {
            console.error('Error fetching file content:', error);
            setCurrentFileContent(`# Error: Could not load content for ${filePath}`);
            setEditContent(`# Error: Could not load content for ${filePath}`);
            setMessage(t('errorLoadingContent'));
            setToc([]); // Clear TOC on error
        }
    };

    /**
     * Fetches all file contents for Lunr.js indexing.
     */
    const fetchAllFileContentsForIndexing = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/all-content-paths`);
            setAllFileContents(response.data);
            // Build Lunr index
            const idx = lunr(function () {
                this.ref('path');
                this.field('name');
                this.field('content');

                response.data.forEach(doc => {
                    // Extract title from content for better search results
                    const titleMatch = doc.content.match(/^#\s*(.*)/m);
                    const title = titleMatch ? titleMatch[1] : doc.path.split('/').pop().replace('.md', '');
                    this.add({
                        path: doc.path,
                        name: title,
                        content: doc.content
                    });
                });
            });
            setSearchIndex(idx);
        } catch (error) {
            console.error('Error fetching all file contents for indexing:', error);
            setMessage(t('errorPreparingSearch'));
        }
    }, [t]);

    /**
     * Handles login request.
     */
    const handleLogin = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}/login`, { username, password }, { withCredentials: true });
            setIsLoggedIn(true);
            setMessage(t('loginSuccessful'));
            setShowLoginModal(false); // Close modal on success
            setUsername(''); // Clear inputs
            setPassword('');
        } catch (error) {
            console.error('Login error:', error);
            setMessage(error.response?.data?.message || t('loginFailed'));
        }
    };

    /**
     * Handles logout request.
     */
    const handleLogout = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}/logout`, {}, { withCredentials: true });
            setIsLoggedIn(false);
            setIsEditing(false); // Exit edit mode on logout
            setMessage(t('logoutSuccessful'));
            // Optionally redirect or reset content here
        } catch (error) {
            console.error('Logout error:', error);
            setMessage(error.response?.data?.message || t('logoutFailed'));
        }
    };

    /**
     * Saves the current file content to the backend.
     */
    const handleSave = async () => {
        if (!isLoggedIn) {
            setMessage(t('youMustBeLoggedIn'));
            return;
        }
        if (!currentFilePath) {
            setMessage(t('noFileSelected'));
            return;
        }
        try {
            const response = await axios.post(`${API_BASE_URL}/file`, {
                path: currentFilePath,
                content: editContent
            }, { withCredentials: true });
            setMessage(response.data.message);
            setCurrentFileContent(editContent); // Update displayed content
            setIsEditing(false); // Exit edit mode
            fetchFileTree(); // Refresh tree in case of new directories created
            fetchAllFileContentsForIndexing(); // Rebuild search index
        } catch (error) {
            console.error('Save error:', error);
            setMessage(error.response?.data?.message || t('failedToSave'));
        }
    };

    /**
     * Deletes a file or an empty folder.
     * @param {string} filePathToDelete - The path of the file/folder to delete.
     * @param {string} type - 'file' or 'folder'.
     */
    const handleDelete = async (filePathToDelete, type) => {
        if (!isLoggedIn) {
            setMessage(t('youMustBeLoggedIn'));
            return;
        }

        const confirmMessage = t('confirmDelete', { type: t(type), path: filePathToDelete });
        const confirmDelete = window.confirm(confirmMessage);
        if (!confirmDelete) return;

        try {
            const response = await axios.delete(`${API_BASE_URL}/file`, {
                params: { path: filePathToDelete },
                withCredentials: true
            });
            setMessage(response.data.message);
            fetchFileTree(); // Refresh tree
            fetchAllFileContentsForIndexing(); // Rebuild search index
            if (currentFilePath === filePathToDelete) {
                // If the deleted file was currently viewed, clear content
                setCurrentFilePath('');
                setCurrentFileContent('');
                setEditContent('');
            }
        } catch (error) {
            console.error('Delete error:', error);
            setMessage(error.response?.data?.message || t('failedToDelete'));
        }
    };

    /**
     * Handles creating a new file or folder.
     */
    const handleCreateNew = async () => {
        if (!isLoggedIn) {
            setMessage(t('youMustBeLoggedIn'));
            return;
        }
        if (!newFileName) {
            setMessage(t('nameCannotBeEmpty'));
            return;
        }

        let fullPath = newFilePathParent ? `${newFilePathParent}/${newFileName}` : newFileName;

        try {
            if (newType === 'folder') {
                const response = await axios.post(`${API_BASE_URL}/folder`, { path: fullPath }, { withCredentials: true });
                setMessage(response.data.message);
            } else { // newType === 'file'
                if (!fullPath.endsWith('.md')) {
                    setMessage(t('fileMustBeMarkdown'));
                    return;
                }
                const response = await axios.post(`${API_BASE_URL}/file`, {
                    path: fullPath,
                    content: newFileContent
                }, { withCredentials: true });
                setMessage(response.data.message);
                setCurrentFilePath(fullPath); // Set newly created file as current
                setCurrentFileContent(newFileContent);
                setEditContent(newFileContent);
                setIsEditing(false); // Not editing by default for new file
            }

            setShowNewFileModal(false);
            setNewFileName('');
            setNewFileContent('');
            setNewFilePathParent('');
            setNewType('file'); // Reset to default
            fetchFileTree(); // Refresh tree to show new item
            fetchAllFileContentsForIndexing(); // Rebuild search index
        } catch (error) {
            console.error('Create new item error:', error);
            setMessage(error.response?.data?.message || t('failedToCreate'));
        }
    };

    /**
     * Handles typing in the textarea and checks for special commands.
     * Also updates the TOC in real-time if in editing mode.
     * @param {Object} e - The change event object from the textarea.
     */
    const handleEditorChange = (e) => {
        const { value, selectionStart, selectionEnd } = e.target;
        setEditContent(value); // Always update content first
        generateTableOfContents(value); // Update TOC as user types

        // Define mapping of commands to their Markdown snippets
        const commands = {
            '/code ': '```javascript\n// Your code here\n```',
            '/title ': '# Your Title Here', // Re-enabled for convenience, can be removed if not desired
            '/body ': 'Your paragraph content here.',
            '/bordered ': '> Your bordered content here.' // Using blockquote for bordered effect
        };

        for (const command in commands) {
            const snippet = commands[command];
            const commandLength = command.length;

            if (
                value.substring(selectionStart - commandLength, selectionStart) === command &&
                (selectionStart === commandLength || value[selectionStart - commandLength - 1] === '\n' || value[selectionStart - commandLength - 1] === ' ')
            ) {
                const newContent = value.substring(0, selectionStart - commandLength) + snippet + value.substring(selectionStart);
                setEditContent(newContent);

                let finalCursorPos = selectionStart - commandLength;

                if (command === '/code ') {
                    finalCursorPos += '```javascript\n// Your code here'.length;
                } else if (command === '/title ') {
                    finalCursorPos += '# Your Title Here'.length;
                } else if (command === '/body ') {
                    finalCursorPos += 'Your paragraph content here.'.length;
                } else if (command === '/bordered ') {
                    finalCursorPos += '> Your bordered content here.'.length;
                }

                // Use setTimeout to ensure DOM is updated before setting selection
                setTimeout(() => {
                    if (editorRef.current) {
                        editorRef.current.selectionStart = finalCursorPos;
                        editorRef.current.selectionEnd = finalCursorPos;
                    }
                }, 0);
                return;
            }
        }
    };


    /**
     * Inserts Markdown syntax into the editor at the current cursor position.
     * @param {string} syntax - The Markdown syntax to insert (e.g., "**bold**", "[]()")
     * @param {number} cursorOffset - The offset from the start of the inserted syntax where the cursor should be placed.
     */
    const insertMarkdown = (syntax, cursorOffset) => {
        if (!editorRef.current) return;

        const { selectionStart, selectionEnd, value } = editorRef.current;
        const newContent = value.substring(0, selectionStart) + syntax + value.substring(selectionEnd);
        setEditContent(newContent);

        const newCursorPos = selectionStart + cursorOffset;

        setTimeout(() => {
            if (editorRef.current) {
                editorRef.current.selectionStart = newCursorPos;
                editorRef.current.selectionEnd = newCursorPos;
                editorRef.current.focus();
            }
        }, 0);
    };

    /**
     * Generates Table of Contents from Markdown content.
     * @param {string} markdown - The Markdown string.
     */
    const generateTableOfContents = useCallback((markdown) => {
        const headings = [];
        const lines = markdown.split('\n');
        lines.forEach(line => {
            const match = line.match(/^(#+)\s(.+)/);
            if (match) {
                const level = match[1].length;
                const text = match[2].trim();
                const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
                headings.push({ level, text, id });
            }
        });
        setToc(headings);
    }, []);

    /**
     * Toggles the theme between 'light' and 'dark'.
     */
    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    /**
     * Toggles the language between 'en' and 'th'.
     */
    const toggleLanguage = () => {
        setLang(prevLang => prevLang === 'en' ? 'th' : 'en');
    };

    // --- Effects ---

    // Effect to check authentication status on component mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/check-auth`, { withCredentials: true });
                setIsLoggedIn(response.data.isAuthenticated);
            } catch (error) {
                console.error('Error checking auth:', error);
                setMessage(t('errorCheckingAuth'));
                setIsLoggedIn(false);
            }
        };
        checkAuth();
        fetchAllFileContentsForIndexing(); // Fetch all content for search indexing on mount
    }, [fetchAllFileContentsForIndexing, t]);

    // Effect to fetch file tree on component mount and when authentication status changes
    useEffect(() => {
        fetchFileTree();
    }, [fetchFileTree, isLoggedIn]);

    // Effect to fetch file content when currentFilePath changes
    useEffect(() => {
        if (currentFilePath) {
            fetchFileContent(currentFilePath);
        }
    }, [currentFilePath]);

    // Effect to re-generate TOC if editContent changes while in editing mode
    useEffect(() => {
        if (isEditing) {
            generateTableOfContents(editContent);
        }
    }, [isEditing, editContent, generateTableOfContents]);

    // --- Search Logic ---
    const filteredFileTree = searchTerm
        ? fileTree.map(item => filterTree(item, searchTerm, searchIndex, allFileContents)).filter(Boolean)
        : fileTree;

    function filterTree(node, term, index, allContents) {
        if (!node) return null;

        let matches = [];
        if (index) {
            try {
                const searchResults = index.search(term);
                // Get paths of matching documents
                const matchingPaths = new Set(searchResults.map(result => result.ref));
                // Find matching content objects
                matches = allContents.filter(content => matchingPaths.has(content.path));
            } catch (e) {
                console.error("Lunr search error:", e);
                // Fallback or show error
            }
        }

        // Check if the current node itself matches the search term (by name or content)
        const nodeContent = allContents.find(fc => fc.path === node.path)?.content || '';
        const nodeMatches = node.type === 'file' && (
            node.name.toLowerCase().includes(term.toLowerCase()) ||
            nodeContent.toLowerCase().includes(term.toLowerCase()) ||
            matches.some(m => m.path === node.path)
        );

        if (node.type === 'file') {
            return nodeMatches ? node : null;
        } else { // It's a folder
            const filteredChildren = node.children
                .map(child => filterTree(child, term, index, allContents))
                .filter(Boolean);

            // A folder is included if it or any of its children match
            if (nodeMatches || filteredChildren.length > 0) {
                return { ...node, children: filteredChildren };
            }
            return null;
        }
    }


    // --- JSX Rendering Helpers ---

    /**
     * Recursive component for rendering file tree nodes.
     * @param {Object} item - The file/folder object.
     * @param {string} parentPath - The path of the parent folder.
     */
    const TreeNode = ({ item, parentPath }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const fullPath = item.path;

        const handleItemClick = () => {
            if (item.type === 'file') {
                setCurrentFilePath(fullPath);
                setIsEditing(false); // Always switch to view mode when clicking a file
                setIsSidebarOpen(false); // Close sidebar on file selection for mobile
            } else {
                setIsExpanded(!isExpanded); // Toggle folder expansion
            }
        };

        const handleNewInFolder = (type) => (e) => {
            e.stopPropagation(); // Prevent folder click from expanding/collapsing
            setNewFilePathParent(fullPath);
            setNewType(type);
            setShowNewFileModal(true);
        };

        return (
            <li className="mb-1">
                <div className="flex items-center justify-between group">
                    <span
                        className={`cursor-pointer flex items-center p-1 rounded-md ${
                            item.type === 'file'
                                ? (theme === 'dark' ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-700 hover:bg-blue-100')
                                : (theme === 'dark' ? 'text-gray-100 font-semibold hover:bg-gray-700' : 'font-semibold text-gray-800 hover:bg-blue-100')
                        } ${currentFilePath === fullPath && !isEditing
                            ? (theme === 'dark' ? 'bg-blue-800' : 'bg-blue-200')
                            : ''
                        }`}
                        onClick={handleItemClick}
                    >
                        {item.type === 'folder' && (
                            <span className="mr-1 text-yellow-500">
                                {isExpanded ? '▼' : '►'}
                            </span>
                        )}
                        {item.type === 'file' && (
                            <span className="mr-1 text-gray-500">📄</span>
                        )}
                        {item.type === 'folder' && (
                            <span className="mr-1 text-yellow-500">📁</span>
                        )}
                        {item.name}
                    </span>
                    {isLoggedIn && (
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {item.type === 'folder' && (
                                <>
                                <button
                                    onClick={handleNewInFolder('file')}
                                    className="text-green-600 hover:text-green-800 text-sm p-1 rounded-full hover:bg-green-100"
                                    title={t('createNewLabel', { type: t('file') })}
                                >
                                    📄+
                                </button>
                                <button
                                    onClick={handleNewInFolder('folder')}
                                    className="text-indigo-600 hover:text-indigo-800 text-sm p-1 rounded-full hover:bg-indigo-100"
                                    title={t('createNewLabel', { type: t('folder') })}
                                >
                                    📁+
                                </button>
                                </>
                            )}
                            <button
                                onClick={() => handleDelete(fullPath, item.type)}
                                className="text-red-600 hover:text-red-800 text-sm p-1 rounded-full hover:bg-red-100"
                                title={t('deleteCurrent')}
                            >
                                🗑️
                            </button>
                        </div>
                    )}
                </div>
                {item.type === 'folder' && isExpanded && item.children && (
                    <ul className={`ml-4 border-l pl-2 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
                        {item.children.map((child) => (
                            <TreeNode key={child.path} item={child} parentPath={fullPath} />
                        ))}
                    </ul>
                )}
            </li>
        );
    };

    // Custom renderer for code blocks in ReactMarkdown for syntax highlighting
    const components = {
        code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
                <SyntaxHighlighter
                    style={solarizedlight} // Apply chosen style
                    language={match[1]}
                    PreTag="div"
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            ) : (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
        h1: ({ node, ...props }) => <h1 id={props.children[0].toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')} {...props} />,
        h2: ({ node, ...props }) => <h2 id={props.children[0].toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')} {...props} />,
        h3: ({ node, ...props }) => <h3 id={props.children[0].toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')} {...props} />,
        h4: ({ node, ...props }) => <h4 id={props.children[0].toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')} {...props} />,
        h5: ({ node, ...props }) => <h5 id={props.children[0].toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')} {...props} />,
        h6: ({ node, ...props }) => <h6 id={props.children[0].toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')} {...props} />,
    };


    // --- Main Render ---

    return (
        <div className={`min-h-screen flex font-inter ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
            {/* Hamburger menu button for small screens */}
            <button
                className={`md:hidden fixed top-0 left-0 right-0 z-50 p-3 h-14 flex items-center justify-between ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} shadow-md`}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label="Toggle sidebar"
            >
                {isSidebarOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                )}
                <span className="text-lg font-semibold">{t('wikiExplorer')}</span>
                <span></span> {/* Empty span to balance justify-between */}
            </button>

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:static top-0 left-0 h-full z-40
                    w-96 p-4 shadow-lg overflow-y-auto flex-shrink-0
                    transition-transform duration-300 ease-in-out
                    ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0 md:block
                    pt-14 md:pt-4
                `}
            >
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-4`}>{t('wikiExplorer')}</h2>

                {/* Search Input */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder={t('searchWiki')}
                        className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <nav>
                    <ul className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {filteredFileTree.length > 0 ? (
                            filteredFileTree.map((item) => (
                                <TreeNode key={item.path} item={item} parentPath="" />
                            ))
                        ) : (
                            <li className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('noResults')}</li>
                        )}
                    </ul>
                </nav>
                <div className="mt-6">
                    {/* These buttons are moved to the main content area for desktop, but still here for mobile sidebar when open */}
                    <button
                        onClick={toggleTheme}
                        className="w-full bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors mb-2 shadow md:hidden"
                    >
                        {theme === 'light' ? t('switchToDark') : t('switchToLight')}
                    </button>
                    <button
                        onClick={toggleLanguage}
                        className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors mb-2 shadow md:hidden"
                    >
                        {lang === 'en' ? 'TH' : 'EN'}
                    </button>
                    {isLoggedIn ? (
                        <>
                            <button
                                onClick={() => {
                                    setNewType('file'); // Default to file
                                    setNewFilePathParent(''); // Default to root
                                    setShowNewFileModal(true);
                                }}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors mb-2 shadow"
                            >
                                {t('newFileFolder')}
                            </button>
                            {/* <button
                                onClick={handleLogout}
                                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors shadow"
                            >
                                {t('logout')}
                            </button> */}
                        </>
                    ) : (
                        // <button
                        //     onClick={() => setShowLoginModal(true)}
                        //     className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors shadow"
                        // >
                        //     {t('login')}
                        // </button>
                        null
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`flex-1 p-8 overflow-y-auto ${theme === 'dark' ? 'bg-gray-900' : ''} ${isSidebarOpen ? 'hidden md:block' : 'w-full'} pt-14 md:pt-8`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <h1 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-4 md:mb-0`}>
                        {currentFilePath.split('/').pop().replace('.md', '') || t('selectAFile')}
                    </h1>
                    {/* Top-right controls (Theme, Language, Login/Logout, Edit/Save/Cancel/Delete) */}
                    <div className="flex flex-wrap items-center justify-end space-x-2 md:space-x-3">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                            title={theme === 'light' ? t('switchToDark') : t('switchToLight')}
                        >
                            {theme === 'light' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h1M3 12h1m15.325-7.325l-.707.707M4.372 19.372l-.707.707M19.372 4.372l-.707-.707M4.372 4.372l-.707-.707M12 18a6 6 0 100-12 6 6 0 000 12z"></path></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                            )}
                        </button>
                        {/* Language Toggle */}
                        <button
                            onClick={toggleLanguage}
                            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                            title={lang === 'en' ? 'Switch to Thai' : 'เปลี่ยนเป็นภาษาอังกฤษ'}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86zM13 3.07v15.86c3.95-.49 7-3.85 7-7.93s-3.05-7.44-7-7.93z"></path></svg>
                        </button>
                        {/* Login/Logout Icon */}
                        {isLoggedIn ? (
                            <button
                                onClick={handleLogout}
                                className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-red-700 text-white hover:bg-red-600' : 'bg-red-600 text-white hover:bg-red-700'}`}
                                title={t('logout')}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowLoginModal(true)}
                                className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                title={t('login')}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m0 4h7m-4 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            </button>
                        )}

                        {/* Edit/Save/Cancel/Delete Buttons - Visible if logged in and file selected */}
                        {isLoggedIn && currentFilePath && (
                            <>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="bg-purple-600 text-white py-2 px-5 rounded-md hover:bg-purple-700 transition-colors shadow-md"
                                    >
                                        {t('edit')}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            className="bg-green-600 text-white py-2 px-5 rounded-md hover:bg-green-700 transition-colors shadow-md"
                                        >
                                            {t('save')}
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="bg-gray-500 text-white py-2 px-5 rounded-md hover:bg-gray-600 transition-colors shadow-md"
                                        >
                                            {t('cancel')}
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => handleDelete(currentFilePath, 'file')}
                                    className="bg-red-600 text-white py-2 px-5 rounded-md hover:bg-red-700 transition-colors shadow-md"
                                >
                                    {t('deleteCurrent')}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Message display */}
                {message && (
                    <div className="p-3 mb-4 rounded-md text-sm bg-yellow-100 text-yellow-800 border border-yellow-200">
                        {message}
                    </div>
                )}

                {/* Editor Toolbar (visible when editing) */}
                {isEditing && (
                    <div className={`p-3 rounded-t-lg shadow-md border-b flex flex-wrap gap-2 mb-0 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                        <button onClick={() => insertMarkdown('**bold**', 2)} className={`toolbar-btn ${theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : ''} font-bold`}>B</button>
                        <button onClick={() => insertMarkdown('*italic*', 1)} className={`toolbar-btn ${theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : ''} italic`}>I</button>
                        <button onClick={() => insertMarkdown('[Link Text](https://example.com)', 1)} className={`toolbar-btn ${theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : ''}`}>🔗</button>
                        <button onClick={() => insertMarkdown('- List item', 2)} className={`toolbar-btn ${theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : ''}`}>• List</button>
                        <button onClick={() => insertMarkdown('1. Ordered list item', 3)} className={`toolbar-btn ${theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : ''}`}>1. List</button>
                        <button onClick={() => insertMarkdown('`inline code`', 1)} className={`toolbar-btn ${theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : ''}`}>`{}`</button>
                        <button onClick={() => insertMarkdown('```javascript\n// code\n```', 15)} className={`toolbar-btn ${theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : ''}`}>{"<Code />"}</button>
                        <button onClick={() => insertMarkdown('## Subheading', 3)} className={`toolbar-btn ${theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : ''}`}>H2</button>
                        <button onClick={() => insertMarkdown('> Blockquote', 2)} className={`toolbar-btn ${theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : ''}`}>&quot;</button>
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className={`toolbar-btn ${showPreview ? 'bg-blue-200' : ''} ${theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : ''}`}
                        >
                            {showPreview ? t('hidePreview') : t('showPreview')}
                        </button>
                    </div>
                )}

                {/* Content Display / Editor */}
                <div className={`p-6 rounded-lg shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} ${isEditing && showPreview ? 'grid grid-cols-2 gap-6' : ''}`}>
                    {isEditing ? (
                        <div className={`${showPreview ? 'border-r pr-6' : ''} ${theme === 'dark' ? 'border-gray-700' : ''}`}>
                            <textarea
                                ref={editorRef} // Assign ref to textarea
                                className={`w-full h-96 p-4 border rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y font-mono text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-800'}`}
                                value={editContent}
                                onChange={handleEditorChange} // Use the new handler
                                placeholder={t('welcomeMessage')}
                            ></textarea>
                        </div>
                    ) : null}

                    {/* Preview Pane or Read-Only View */}
                    {(!isEditing || showPreview) && (
                        <div className="markdown-body prose max-w-none w-full">
                            {currentFileContent ? (
                                <>
                                    {/* Table of Contents */}
                                    {toc.length > 0 && (
                                        <div className={`p-4 rounded-md mb-6 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                            <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{t('tableOfContents')}</h3>
                                            <ul className="list-none p-0 m-0">
                                                {toc.map((heading, index) => (
                                                    <li key={index} className={`ml-${(heading.level - 1) * 4}`}>
                                                        <a href={`#${heading.id}`} className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>
                                                            {heading.text}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                                        {isEditing ? editContent : currentFileContent || t('selectAFile')}
                                    </ReactMarkdown>
                                </>
                            ) : (
                                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('selectAFile')}</p>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className={`p-6 rounded-lg shadow-xl w-96 animate-fade-in-down ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white'}`}>
                        <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-gray-100' : ''}`}>{t('login')}</h3>
                        <input
                            type="text"
                            placeholder={t('username')}
                            className={`w-full p-2 border rounded-md mb-3 focus:ring-blue-500 focus:border-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder={t('password')}
                            className={`w-full p-2 border rounded-md mb-4 focus:ring-blue-500 focus:border-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className={`px-4 py-2 rounded-md ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleLogin}
                                className={`px-4 py-2 text-white rounded-md ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {t('login')}
                            </button>
                        </div>
                        {message && (
                            <p className="text-red-500 text-sm mt-3">{message}</p>
                        )}
                    </div>
                </div>
            )}

            {/* New File/Folder Modal */}
            {showNewFileModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className={`p-6 rounded-lg shadow-xl w-96 animate-fade-in-down ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white'}`}>
                        <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-gray-100' : ''}`}>{t('createNewLabel', { type: t(newType) })}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                            {t('parentPath')} `{newFilePathParent ? `${newFilePathParent}/` : t('root')}`
                        </p>

                        <div className="mb-3 flex space-x-2">
                            <button
                                className={`px-4 py-2 rounded-md ${newType === 'file' ? (theme === 'dark' ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white') : (theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
                                onClick={() => setNewType('file')}
                            >
                                {t('file')}
                            </button>
                            <button
                                className={`px-4 py-2 rounded-md ${newType === 'folder' ? (theme === 'dark' ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white') : (theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
                                onClick={() => setNewType('folder')}
                            >
                                {t('folder')}
                            </button>
                        </div>

                        <input
                            type="text"
                            placeholder={newType === 'file' ? t('fileNamePlaceholder') : t('folderNamePlaceholder')}
                            className={`w-full p-2 border rounded-md mb-3 focus:ring-blue-500 focus:border-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                        />
                         {/* Only show content input for new files (not folders) */}
                        {newType === 'file' && (
                            <textarea
                                placeholder={t('initialContentOptional')}
                                className={`w-full h-32 p-2 border rounded-md mb-4 focus:ring-blue-500 focus:border-blue-500 resize-y ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                                value={newFileContent}
                                onChange={(e) => setNewFileContent(e.target.value)}
                            ></textarea>
                        )}
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowNewFileModal(false);
                                    setNewFileName('');
                                    setNewFileContent('');
                                    setNewFilePathParent('');
                                    setNewType('file'); // Reset type on close
                                }}
                                className={`px-4 py-2 rounded-md ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleCreateNew}
                                className={`px-4 py-2 text-white rounded-md ${theme === 'dark' ? 'bg-green-700 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                {t('create')}
                            </button>
                        </div>
                        {message && (
                            <p className="text-red-500 text-sm mt-3">{message}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
