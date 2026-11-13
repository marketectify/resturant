import Icon from './Icon.jsx';
import Thumb from './Thumb.jsx';
import Heart from './Heart.jsx';
import { useStore } from '../store.jsx';
import { rs } from '../config.js';

export default function ItemCard({ item }) {
  const { add, setDetail } = useStore();
  const open = () => setDetail(item);
  return (
    <article
      className="card clickable"
      role="button"
      tabIndex={0}
      aria-label={`${item.name}, ${rs(item.price)}. Open details`}
      onClick={open}
      onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(); } }}
    >
      {item.badge && <span className="badge">{item.badge}</span>}
      <div className="card-img"><Thumb item={item} /></div>
      <div className="card-text">
        <h3>{item.name}</h3>
        {item.desc && <p>{item.desc}</p>}
      </div>
      <div className="card-foot">
        <span className="price">{rs(item.price)}</span>
        <Heart id={item._id} />
        <button className="add" onClick={e => { e.stopPropagation(); add(item); }} aria-label={`Add ${item.name} to cart`}>
          <Icon name="plus" size={18} stroke={2.8} />
        </button>
      </div>
    </article>
  );
}
