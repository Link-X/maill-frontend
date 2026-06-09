import { useTranslation } from 'react-i18next';
import { type AreaPriceVO } from '@maill/shared';
import { formatMoney } from '@/lib/format';

/** 价位区域图例卡 — 场次页与选座页共用 */
export function PriceLegendCard({
  areaPriceList,
  priceColorMap,
}: {
  areaPriceList: AreaPriceVO[];
  priceColorMap: Map<string, string>;
}) {
  const { t } = useTranslation(['session']);
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-3">
      <div className="text-[11px] text-muted-foreground mb-2">价位区域</div>
      <div className="flex flex-wrap gap-1.5">
        {areaPriceList.map((p) => (
          <PriceLegendChip
            key={p.areaId}
            color={priceColorMap.get(p.areaId) ?? '#94a3b8'}
            price={formatMoney(p.price)}
            isAllocate={p.saleMode === 2}
          />
        ))}
      </div>
      <div className="flex gap-4 mt-3 pt-2.5 border-t border-border/40 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-brand ring-2 ring-brand/25" />
          {t('session:userSeat.legendSelected')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-foreground/30 ring-1 ring-foreground/10" />
          {t('session:userSeat.legendSold')}
        </span>
      </div>
    </div>
  );
}

function PriceLegendChip({
  color,
  price,
  isAllocate,
}: {
  color: string;
  price: string;
  isAllocate?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 pl-1 pr-2 h-5 rounded-full
                 bg-muted/60 border border-border/40 text-[11px] font-medium tabular-nums"
    >
      <span className="inline-block h-3 w-3 rounded-sm" style={{ background: color }} />
      {price}
      {isAllocate && (
        <span className="text-[9px] text-muted-foreground/80 font-normal ml-0.5">派座</span>
      )}
    </span>
  );
}
