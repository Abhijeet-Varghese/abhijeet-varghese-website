<?php
/**
 * AV OS — minimal pure-PHP PDF writer (no Composer, no external libs).
 * Generates valid PDF 1.4 documents with Helvetica + WinAnsi text,
 * lines and rectangles. Used by the proposal engine for PDF export —
 * fully Hostinger-compatible (needs only core PHP).
 */
final class Pdf
{
    private array $objects = [];   // object number => content
    private int $n = 0;
    private array $pages = [];     // page content streams (object ids)
    private array $cur = [];
    private float $x = 0, $y = 0;
    private float $pageW = 595, $pageH = 842; // A4 portrait (pt)
    private float $fontSize = 10;
    private bool $bold = false;
    private string $fill = '0 0 0';
    private string $stroke = '0 0 0';

    public function __construct()
    {
        $this->addPage();
    }

    /* ---------- low level ---------- */
    private function obj(string $body): int
    {
        $this->objects[++$this->n] = $body;
        return $this->n;
    }

    private function addPage(): void
    {
        if ($this->cur !== []) {
            $this->pages[] = implode("\n", $this->cur);
        }
        $this->cur = [];
        $this->x = 56; $this->y = $this->pageH - 56;
    }

    private function pageStream(string $content): int
    {
        return $this->obj("<< /Length " . strlen($content) . " >>\nstream\n" . $content . "\nendstream");
    }

    private function emit(string $s): void { $this->cur[] = $s; }

    /* ---------- drawing ---------- */
    public function setFont(float $size, bool $bold = false): void
    {
        $this->fontSize = $size; $this->bold = $bold;
    }

    public function setColor(float $r, float $g, float $b): void
    {
        $this->fill = "{$r} {$g} {$b}";
    }

    /** cp1252-safe text; unsupported glyphs become '?'. Pure PHP (mbstring table not guaranteed). */
    private static function win(string $s): string
    {
        static $map = [
            0x20AC => 0x80, 0x201A => 0x82, 0x0192 => 0x83, 0x201E => 0x84, 0x2026 => 0x85,
            0x2020 => 0x86, 0x2021 => 0x87, 0x02C6 => 0x88, 0x2030 => 0x89, 0x0160 => 0x8A,
            0x2039 => 0x8B, 0x0152 => 0x8C, 0x017D => 0x8E, 0x2018 => 0x91, 0x2019 => 0x92,
            0x201C => 0x93, 0x201D => 0x94, 0x2022 => 0x95, 0x2013 => 0x96, 0x2014 => 0x97,
            0x02DC => 0x98, 0x2122 => 0x99, 0x0161 => 0x9A, 0x203A => 0x9B, 0x0153 => 0x9C,
            0x017E => 0x9E, 0x0178 => 0x9F,
        ];
        $out = '';
        $len = strlen($s);
        for ($i = 0; $i < $len; $i++) {
            $c = ord($s[$i]);
            if ($c < 0x80) { $out .= $s[$i]; continue; }
            $cp = 0;
            if (($c & 0xE0) === 0xC0 && $i + 1 < $len) { $cp = (($c & 0x1F) << 6) | (ord($s[++$i]) & 0x3F); }
            elseif (($c & 0xF0) === 0xE0 && $i + 2 < $len) { $cp = (($c & 0x0F) << 12) | ((ord($s[++$i]) & 0x3F) << 6) | (ord($s[++$i]) & 0x3F); }
            elseif (($c & 0xF8) === 0xF0 && $i + 3 < $len) { $cp = (($c & 0x07) << 18) | ((ord($s[++$i]) & 0x3F) << 12) | ((ord($s[++$i]) & 0x3F) << 6) | (ord($s[++$i]) & 0x3F); }
            else { $out .= '?'; continue; }
            if (isset($map[$cp])) { $out .= chr($map[$cp]); continue; }
            // latin-1 range maps 1:1
            if ($cp >= 0xA0 && $cp <= 0xFF) { $out .= chr($cp); continue; }
            $out .= '?';
        }
        // escape PDF specials
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $out);
    }

    public function text(string $s): void
    {
        $s = self::win($s);
        $this->emit("BT /F" . ($this->bold ? 2 : 1) . " {$this->fontSize} Tf {$this->fill} rg {$this->x} {$this->y} Td (" . $s . ") Tj ET");
        $this->x += $this->strWidth($s);
    }

    public function strWidth(string $s): float
    {
        // Helvetica widths (approx, average 0.5em per char)
        return strlen(self::win($s)) * $this->fontSize * 0.5;
    }

    public function textAt(float $x, float $y, string $s, float $size, bool $bold = false): void
    {
        $this->x = $x; $this->y = $y; $this->setFont($size, $bold);
        $this->text($s);
    }

    public function line(float $x1, float $y1, float $x2, float $y2, float $w = 0.8): void
    {
        $this->emit("{$this->stroke} RG {$w} w {$x1} {$y1} m {$x2} {$y2} l S");
    }

    public function rect(float $x, float $y, float $w, float $h, bool $filled = false): void
    {
        $this->emit(($filled ? "{$this->fill} rg" : "{$this->stroke} RG") . " {$x} {$y} {$w} {$h} re " . ($filled ? 'f' : 'S'));
    }

    /** wrap text to max width; returns lines */
    public function wrap(string $s, float $maxW): array
    {
        $words = preg_split('/\s+/', trim($s)) ?: [];
        $lines = []; $cur = '';
        foreach ($words as $w) {
            $try = $cur === '' ? $w : $cur . ' ' . $w;
            if ($this->strWidth($try) <= $maxW) { $cur = $try; continue; }
            if ($cur !== '') { $lines[] = $cur; $cur = $w; }
            else { $lines[] = $w; $cur = ''; }
        }
        if ($cur !== '') $lines[] = $cur;
        return $lines;
    }

    /** paragraph with wrapping; returns final y */
    public function para(string $s, float $size, float $maxW, float $lineGap = 1.45): float
    {
        $this->setFont($size);
        foreach ($this->wrap($s, $maxW) as $line) {
            if ($this->y < 70) { $this->newPage(); }
            $this->x = 56;
            $this->text($line);
            $this->y -= $size * $lineGap;
        }
        return $this->y;
    }

    public function newPage(): void
    {
        $this->addPage();
    }

    /* ---------- output ---------- */
    public function output(): string
    {
        // flush last page, then build font/page tree objects
        if ($this->cur !== []) $this->pages[] = implode("\n", $this->cur);
        $font1 = $this->obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
        $font2 = $this->obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
        $streamIds = [];
        foreach ($this->pages as $content) {
            $streamIds[] = $this->pageStream($content);
        }
        // pagesObj id is known in advance: streams + P page objects + 1
        $pagesObjId = $this->n + 1 + count($this->pages);
        $resources = "<< /Font << /F1 {$font1} 0 R /F2 {$font2} 0 R >> >>";
        $pageObjIds = [];
        foreach ($streamIds as $sid) {
            $pageObjIds[] = $this->obj("<< /Type /Page /Parent {$pagesObjId} 0 R /MediaBox [0 0 {$this->pageW} {$this->pageH}] /Contents {$sid} 0 R >>");
        }
        $kids = implode(' ', array_map(fn($id) => "$id 0 R", $pageObjIds));
        $pagesObj = $this->obj("<< /Type /Pages /Kids [{$kids}] /Count " . count($pageObjIds) . " /Resources {$resources} >>");
        $catalog = $this->obj("<< /Type /Catalog /Pages {$pagesObj} 0 R >>");

        $content = "%PDF-1.4\n";
        $offsets = [];
        foreach ($this->objects as $id => $body) {
            $offsets[$id] = strlen($content);
            $content .= "{$id} 0 obj\n{$body}\nendobj\n";
        }
        $xrefPos = strlen($content);
        $content .= "xref\n0 " . ($this->n + 1) . "\n";
        $content .= "0000000000 65535 f \n";
        for ($i = 1; $i <= $this->n; $i++) {
            $content .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }
        $content .= "trailer\n<< /Size " . ($this->n + 1) . " /Root {$catalog} 0 R >>\nstartxref\n{$xrefPos}\n%%EOF\n";
        return $content;
    }

    /**
     * Render a proposal document (from the proposals table) to PDF bytes.
     */
    public static function proposal(array $p, array $site): string
    {
        $pdf = new Pdf();
        $W = 595 - 112; // usable width

        /* brand bar */
        $pdf->rect(0, $pdf->pageH - 100, 595, 100, true);
        $pdf->setColor(1, 1, 1);
        $pdf->textAt(56, $pdf->pageH - 62, 'AV OS', 22, true);
        $pdf->textAt(56, $pdf->pageH - 80, $site['siteName'] ?? 'Abhijeet Varghese', 10);
        $pdf->textAt(56, $pdf->pageH - 92, 'Proposal of Engagement', 8.5);
        $pdf->setColor(0, 0, 0);

        $pdf->y = $pdf->pageH - 130;

        /* title */
        $pdf->textAt(56, $pdf->y, $p['title'] ?? 'Proposal', 20, true);
        $pdf->y -= 20;

        /* meta grid */
        $meta = [
            ['Client', $p['client_name'] ?? ''],
            ['Prepared', date('d M Y', strtotime($p['created_at'] ?? 'now'))],
            ['Timeline', $p['timeline'] ?? ''],
            ['Valid for', (int)($p['validity_days'] ?? 30) . ' days'],
        ];
        foreach ($meta as $i => [$k, $v]) {
            $x = 56 + ($i % 2) * 240;
            $yy = $pdf->y - (int)($i / 2) * 30;
            $pdf->textAt($x, $yy, strtoupper($k), 8, true);
            $pdf->setColor(0.25, 0.25, 0.25);
            $pdf->textAt($x, $yy - 14, $v, 10.5);
            $pdf->setColor(0, 0, 0);
        }
        $pdf->y -= 78;
        $pdf->line(56, $pdf->y, 539, $pdf->y, 0.6);

        /* sections */
        $pdf->y -= 22;
        $pdf->textAt(56, $pdf->y, 'SCOPE', 11, true);
        $pdf->y -= 16;
        $pdf->para($p['scope'] ?? '', 10, $W);
        $pdf->y -= 8;

        $deliverables = $p['deliverables'] ?? [];
        if (is_string($deliverables)) $deliverables = array_filter(array_map('trim', explode("\n", $deliverables)));
        if ($deliverables) {
            $pdf->y -= 14;
            $pdf->textAt(56, $pdf->y, 'DELIVERABLES', 11, true);
            $pdf->y -= 16;
            foreach ($deliverables as $d) {
                if ($pdf->y < 90) { $pdf->newPage(); }
                $pdf->x = 56;
                $pdf->text('•  ');
                $pdf->para($d, 10, $W - 20);
                $pdf->y -= 4;
            }
            $pdf->y -= 8;
        }

        $pdf->y -= 14;
        $pdf->textAt(56, $pdf->y, 'INVESTMENT', 11, true);
        $pdf->y -= 18;
        $pdf->rect(56, $pdf->y - 30, 240, 30, true);
        $pdf->setColor(1, 1, 1);
        $pdf->textAt(72, $pdf->y - 10, 'Total investment', 8.5);
        $pdf->textAt(72, $pdf->y - 24, ($p['currency'] ?? 'INR') . ' ' . number_format((float)($p['investment'] ?? 0), 2), 14, true);
        $pdf->setColor(0, 0, 0);
        $pdf->y -= 52;

        if (!empty($p['terms'])) {
            $pdf->textAt(56, $pdf->y, 'TERMS', 11, true);
            $pdf->y -= 16;
            $pdf->para($p['terms'] ?? '', 10, $W);
            $pdf->y -= 8;
        }

        /* signature block */
        $pdf->y -= 24;
        if ($pdf->y < 160) $pdf->newPage();
        $pdf->line(56, $pdf->y, 260, $pdf->y, 0.6);
        $pdf->line(340, $pdf->y, 539, $pdf->y, 0.6);
        $pdf->setColor(0.3, 0.3, 0.3);
        $pdf->textAt(56, $pdf->y - 14, 'Client signature', 8.5);
        $pdf->textAt(340, $pdf->y - 14, 'Abhijeet Varghese', 8.5);
        $pdf->setColor(0, 0, 0);

        /* footer */
        $pdf->line(56, 46, 539, 46, 0.5);
        $pdf->setColor(0.45, 0.45, 0.45);
        $pdf->textAt(56, 34, 'Generated by AV OS — ' . ($site['siteName'] ?? 'abhijeetvarghese.com'), 8);
        $pdf->textAt(450, 34, 'Page', 8);

        return $pdf->output();
    }
}
