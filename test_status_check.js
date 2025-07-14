#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeToTempFile(content, filename) {
    const tempFile = path.join(__dirname, filename);
    fs.writeFileSync(tempFile, content, 'utf8');
    console.log(`結果を ${filename} に保存しました`);
    return tempFile;
}

function countTestCases() {
    const testDir = path.join(__dirname, 'test');
    const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.test.js'));
    
    let totalTests = 0;
    let testDetails = [];
    
    testFiles.forEach(file => {
        const content = fs.readFileSync(path.join(testDir, file), 'utf8');
        // describe, test, it のパターンをカウント
        const testMatches = content.match(/(test|it)\s*\(/g) || [];
        const describeMatches = content.match(/describe\s*\(/g) || [];
        
        const fileTestCount = testMatches.length;
        totalTests += fileTestCount;
        
        testDetails.push({
            file,
            tests: fileTestCount,
            describes: describeMatches.length
        });
    });
    
    return { totalTests, testDetails, testFiles };
}

function getProjectStatus() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const { totalTests, testDetails } = countTestCases();
    
    const status = {
        timestamp: new Date().toISOString(),
        projectName: packageJson.name,
        version: packageJson.version,
        testStatistics: {
            totalTestFiles: testDetails.length,
            totalTestCases: totalTests,
            breakdown: testDetails
        }
    };
    
    return status;
}

try {
    console.log('プロジェクトの状態を確認中...');
    
    // プロジェクト状態を取得
    const status = getProjectStatus();
    
    // テスト実行を試行
    let testOutput = '';
    try {
        console.log('テストを実行中...');
        testOutput = execSync('npm test', { 
            encoding: 'utf8', 
            timeout: 30000,
            cwd: __dirname 
        });
    } catch (error) {
        testOutput = `テスト実行エラー:\n${error.message}\n${error.stdout || ''}\n${error.stderr || ''}`;
    }
    
    // 結果をまとめる
    const fullReport = `# SidepanelFallback プロジェクト状態レポート

## 基本情報
- プロジェクト名: ${status.projectName}
- バージョン: ${status.version}
- 確認日時: ${status.timestamp}

## テスト統計
- テストファイル数: ${status.testStatistics.totalTestFiles}
- 総テストケース数: ${status.testStatistics.totalTestCases}

### ファイル別内訳:
${status.testStatistics.breakdown.map(item => 
    `- ${item.file}: ${item.tests} テストケース (${item.describes} describe blocks)`
).join('\n')}

## テスト実行結果
${testOutput}

## ファイル構成
${fs.readdirSync('.').filter(f => !f.startsWith('.')).join(', ')}
`;
    
    // 一時ファイルに書き出し
    const tempFile = writeToTempFile(fullReport, `project_status_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.md`);
    
    console.log('\n=== プロジェクト概要 ===');
    console.log(`総テストケース数: ${status.testStatistics.totalTestCases}`);
    console.log(`テストファイル数: ${status.testStatistics.totalTestFiles}`);
    console.log(`詳細レポート: ${path.basename(tempFile)}`);
    
} catch (error) {
    const errorReport = `エラーレポート - ${new Date().toISOString()}\n\n${error.message}\n${error.stack}`;
    writeToTempFile(errorReport, `error_report_${Date.now()}.txt`);
    console.error('エラーが発生しました:', error.message);
}
