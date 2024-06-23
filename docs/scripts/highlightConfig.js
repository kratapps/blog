const decimalDigits = '[0-9](_*[0-9])*';
const frac = `\\.(${decimalDigits})`;
const hexDigits = '[0-9a-fA-F](_*[0-9a-fA-F])*';

const NUMERIC = {
    className: 'number',
    variants: [
        // DecimalFloatingPointLiteral
        // including ExponentPart
        {
            begin: `(\\b(${decimalDigits})((${frac})|\\.)?|(${frac}))` + `[eE][+-]?(${decimalDigits})[fFdD]?\\b`
        },
        // excluding ExponentPart
        { begin: `\\b(${decimalDigits})((${frac})[fFdD]?\\b|\\.([fFdD]\\b)?)` },
        { begin: `(${frac})[fFdD]?\\b` },
        { begin: `\\b(${decimalDigits})[fFdD]\\b` },
        // HexadecimalFloatingPointLiteral
        {
            begin: `\\b0[xX]((${hexDigits})\\.?|(${hexDigits})?\\.(${hexDigits}))` + `[pP][+-]?(${decimalDigits})[fFdD]?\\b`
        },
        // DecimalIntegerLiteral
        { begin: '\\b(0|[1-9](_*[0-9])*)[lL]?\\b' },
        // HexIntegerLiteral
        { begin: `\\b0[xX](${hexDigits})[lL]?\\b` },
        // OctalIntegerLiteral
        { begin: '\\b0(_*[0-7])*[lL]?\\b' },
        // BinaryIntegerLiteral
        { begin: '\\b0[bB][01](_*[01])*[lL]?\\b' }
    ],
    relevance: 0
};

// deno-lint-ignore no-explicit-any
function languageApex(hljs) {
    const APEX_IDENT_RE = '[\u00C0-\u02B8a-zA-Z][\u00C0-\u02B8a-zA-Z_0-9]*';
    const GENERIC_IDENT_RE = APEX_IDENT_RE + '(<' + APEX_IDENT_RE + '(\\s*,\\s*' + APEX_IDENT_RE + ')*>)?';
    const KEYWORDS =
        'abstract activate and any array as asc autonomous begin bigdecimal blob boolean ' +
        'break bulk by byte case cast catch char class collect commit const continue currency date datetime ' +
        'decimal default delete desc do double else end enum exception exit export extends false final finally ' +
        'float for from global goto group having hint if implements import inner insert instanceof int integer ' +
        'interface into join like limit long loop merge new not null nulls number object of on or ' +
        'outer override package parallel pragma private protected public retrieve return rollback select ' +
        'short sort static string super switch synchronized testmethod then this throw time ' +
        'transaction trigger true try undelete update upsert using virtual void webservice when where while ' +
        'without with sharing';

    const ANNOTATION = {
        className: 'meta',
        begin: '@' + APEX_IDENT_RE,
        contains: [
            {
                begin: /\(/,
                end: /\)/,
                contains: ['self'] // allow nested () inside our annotation
            }
        ]
    };
    const NUMBER = NUMERIC;

    return {
        name: 'Apex',
        keywords: KEYWORDS,
        illegal: /<\/|#/,
        case_insensitive: true,
        contains: [
            hljs.COMMENT('/\\*\\*', '\\*/', {
                relevance: 0,
                contains: [
                    {
                        // eat up @'s in emails to prevent them to be recognized as doctags
                        begin: /\w+@/,
                        relevance: 0
                    },
                    {
                        className: 'doctag',
                        begin: '@[A-Za-z]+'
                    }
                ]
            }),
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE,
            {
                className: 'class',
                beginKeywords: 'class interface enum',
                end: /[{;=]/,
                excludeEnd: true,
                relevance: 1,
                keywords: 'class interface enum',
                illegal: /[:"\[\]]/,
                contains: [{ beginKeywords: 'extends implements' }, hljs.UNDERSCORE_TITLE_MODE]
            },
            {
                className: 'constructor-call',
                begin: /\snew\s+(\s*[a-zA-Z][a-zA-Z0-9_]+\s*\.\s*)*(?=[a-zA-Z][a-zA-Z0-9_]+\s*?\()/,
                excludeBegin: true,
                end: /[a-zA-Z][a-zA-Z0-9_]+(?=\s*?\()/
            },
            {
                className: 'call',
                begin: /\.\s*?(?=[a-zA-Z][a-zA-Z0-9_]+\s*?\()/,
                excludeBegin: true,
                end: /[a-zA-Z][a-zA-Z0-9_]+(?=\s*?\()/
            },
            {
                className: 'soql',
                begin: /\[\s*?SELECT\s/,
                end: /.*?FROM\s.*?\s*?]/,
                keywords: KEYWORDS
            },
            {
                className: 'sosl',
                begin: /\[\s*?FIND\s/,
                end: /.*?RETURNING\s.*?\s*?]/
            },
            {
                // Expression keywords prevent 'keyword Name(...)' from being
                // recognized as a function definition
                beginKeywords: 'new throw return else',
                relevance: 0
            },
            {
                className: 'class',
                begin: 'record\\s+' + hljs.UNDERSCORE_IDENT_RE + '\\s*\\(',
                returnBegin: true,
                excludeEnd: true,
                end: /[{;=]/,
                keywords: KEYWORDS,
                contains: [
                    { beginKeywords: 'record' },
                    {
                        begin: hljs.UNDERSCORE_IDENT_RE + '\\s*\\(',
                        returnBegin: true,
                        relevance: 0,
                        contains: [hljs.UNDERSCORE_TITLE_MODE]
                    },
                    {
                        className: 'params',
                        begin: /\(/,
                        end: /\)/,
                        keywords: KEYWORDS,
                        relevance: 0,
                        contains: [hljs.C_BLOCK_COMMENT_MODE]
                    },
                    hljs.C_LINE_COMMENT_MODE,
                    hljs.C_BLOCK_COMMENT_MODE
                ]
            },
            {
                className: 'function',
                begin: '(' + GENERIC_IDENT_RE + '\\s+)+' + hljs.UNDERSCORE_IDENT_RE + '\\s*\\(',
                returnBegin: true,
                end: /[{;=]/,
                excludeEnd: true,
                keywords: KEYWORDS,
                contains: [
                    {
                        begin: hljs.UNDERSCORE_IDENT_RE + '\\s*\\(',
                        returnBegin: true,
                        relevance: 0,
                        contains: [hljs.UNDERSCORE_TITLE_MODE]
                    },
                    {
                        className: 'params',
                        begin: /\(/,
                        end: /\)/,
                        keywords: KEYWORDS,
                        relevance: 0,
                        contains: [ANNOTATION, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, NUMBER, hljs.C_BLOCK_COMMENT_MODE]
                    },
                    hljs.C_LINE_COMMENT_MODE,
                    hljs.C_BLOCK_COMMENT_MODE
                ]
            },
            NUMBER,
            ANNOTATION
        ]
    };
}

hljs.registerLanguage('apex', () => languageApex(hljs));
hljs.highlightAll();
