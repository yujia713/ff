/**
 * localStorage 数据存储模块
 * 负责 senior_info 数据的增删改查操作
 */

const STORAGE_KEY = 'senior_info';

// 获取所有数据
function getAll() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// 保存所有数据
function saveAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 生成唯一ID
function generateId() {
    const data = getAll();
    if (data.length === 0) return 1;
    return Math.max(...data.map(item => item.id)) + 1;
}

// 添加数据
function add(item) {
    const data = getAll();
    const newItem = {
        id: generateId(),
        college: item.college,
        major: item.major,
        year: item.year || '',
        direction: item.direction,
        skill: item.skill || '',
        contact: item.contact || '',
        is_show: item.is_show === true || item.is_show === 'true',
        email: item.email,
        status: item.status !== undefined ? (item.status === true || item.status === 'true') : true,
        created_at: new Date().toISOString()
    };
    data.push(newItem);
    saveAll(data);
    return newItem;
}

// 更新数据
function update(id, updates) {
    const data = getAll();
    const index = data.findIndex(item => item.id === parseInt(id));
    if (index === -1) return null;
    
    data[index] = { ...data[index], ...updates, id: parseInt(id) };
    saveAll(data);
    return data[index];
}

// 删除数据
function remove(id) {
    const data = getAll();
    const filtered = data.filter(item => item.id !== parseInt(id));
    saveAll(filtered);
    return filtered.length < data.length;
}

// 根据条件查询
function query(filters = {}) {
    let data = getAll();
    
    // 筛选状态：默认只显示 status 为 true 的数据
    // 如果 filters.status 为 null 或 undefined，默认筛选状态为 true 的数据
    // 如果 filters.status 为 'all'，则不筛选状态
    // 如果 filters.status 为 true 或 false，按指定状态筛选
    if (filters.status === 'all') {
        // 不筛选状态，显示所有数据
    } else if (filters.status === true || filters.status === false) {
        data = data.filter(item => item.status === filters.status);
    } else {
        // 默认只显示正常状态的数据
        data = data.filter(item => item.status === true);
    }
    
    if (filters.college && filters.college !== 'all') {
        data = data.filter(item => item.college === filters.college);
    }
    
    if (filters.major && filters.major !== 'all') {
        data = data.filter(item => item.major === filters.major);
    }
    
    if (filters.direction && filters.direction !== 'all') {
        data = data.filter(item => item.direction === filters.direction);
    }
    
    if (filters.email) {
        data = data.filter(item => item.email === filters.email);
    }
    
    return data;
}

// 根据ID获取单条数据
function getById(id) {
    const data = getAll();
    return data.find(item => item.id === parseInt(id)) || null;
}

// 获取唯一值列表（用于筛选联动）
function getUniqueValues(field) {
    const data = getAll();
    const values = [...new Set(data.map(item => item[field]).filter(v => v))];
    return values.sort();
}

// 获取学院列表
function getColleges() {
    return getUniqueValues('college');
}

// 获取专业列表
function getMajors() {
    return getUniqueValues('major');
}

// 获取发展方向列表
function getDirections() {
    return ['考研', '全职工作', '留学', '公考'];
}

// 导出CSV
function exportCSV() {
    const data = getAll();
    const headers = ['id', 'college', 'major', 'year', 'direction', 'skill', 'contact', 'is_show', 'email', 'status'];
    const csvContent = [
        headers.join(','),
        ...data.map(item => headers.map(h => {
            let val = item[h];
            if (typeof val === 'boolean') val = val ? 'TRUE' : 'FALSE';
            if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                val = '"' + val.replace(/"/g, '""') + '"';
            }
            return val || '';
        }).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'senior_info.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// 导入CSV
function importCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(line => line.trim());
                const headers = lines[0].split(',');
                const data = [];
                
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',');
                    const item = {};
                    headers.forEach((h, idx) => {
                        let val = values[idx] || '';
                        if (val.startsWith('"') && val.endsWith('"')) {
                            val = val.slice(1, -1).replace(/""/g, '"');
                        }
                        if (h === 'id' || h === 'is_show' || h === 'status') {
                            val = val === 'TRUE' ? true : val === 'FALSE' ? false : (val ? parseInt(val) : '');
                        }
                        item[h.trim()] = val.trim();
                    });
                    if (item.college && item.major && item.direction && item.email) {
                        data.push(item);
                    }
                }
                
                const existingData = getAll();
                const mergedData = [...existingData, ...data];
                saveAll(mergedData);
                resolve(data.length);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// 模块导出
window.Storage = {
    getAll,
    saveAll,
    add,
    update,
    remove,
    query,
    getById,
    getColleges,
    getMajors,
    getDirections,
    exportCSV,
    importCSV
};
